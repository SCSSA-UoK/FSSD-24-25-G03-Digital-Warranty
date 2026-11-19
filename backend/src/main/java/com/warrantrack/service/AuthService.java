package com.warrantrack.service;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.warrantrack.dto.auth.*;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.exception.DuplicateResourceException;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.exception.UnauthorizedException;
import com.warrantrack.model.Retailer;
import com.warrantrack.model.User;
import com.warrantrack.model.enums.AccountStatus;
import com.warrantrack.model.enums.ApprovalStatus;
import com.warrantrack.model.enums.Role;
import com.warrantrack.repository.PurchaseRepository;
import com.warrantrack.repository.RetailerRepository;
import com.warrantrack.repository.UserRepository;
import com.warrantrack.security.JwtTokenProvider;
import com.warrantrack.util.EmailNormalizer;
import com.warrantrack.util.OtpUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);


    private final UserRepository userRepository;
    private final RetailerRepository retailerRepository;
    private final PurchaseRepository purchaseRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;
    private final EmailService emailService;
    private final CustomerLinkingService customerLinkingService;

    public AuthService(UserRepository userRepository,
                       RetailerRepository retailerRepository,
                       PurchaseRepository purchaseRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuditService auditService,
                       EmailService emailService,
                       CustomerLinkingService customerLinkingService) {
        this.userRepository = userRepository;
        this.retailerRepository = retailerRepository;
        this.purchaseRepository = purchaseRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditService = auditService;
        this.emailService = emailService;
        this.customerLinkingService = customerLinkingService;
    }

    @Value("${app.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${app.otp.max-attempts:5}")
    private int otpMaxAttempts;

    @Value("${app.otp.resend-cooldown-seconds:60}")
    private int otpResendCooldownSeconds;

    @Transactional
    public AuthResponse registerCustomer(RegisterCustomerRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());

        if (userRepository.existsByEmailNormalized(normalizedEmail)) {
            throw new DuplicateResourceException("An account with this email address already exists.");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim())
                .emailNormalized(normalizedEmail)
                .phone(request.getPhone().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .emailVerified(false)
                .accountStatus(AccountStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        user = userRepository.save(user);

        // Generate and send verification OTP
        sendEmailVerificationOtp(user);

        return AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .build();
    }

    @Transactional
    public AuthResponse registerRetailer(RegisterRetailerRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());

        if (userRepository.existsByEmailNormalized(normalizedEmail)) {
            throw new DuplicateResourceException("An account with this email address already exists.");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim())
                .emailNormalized(normalizedEmail)
                .phone(request.getContactPhone().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.RETAILER)
                .emailVerified(true) // Retailers verified via manual admin review
                .accountStatus(AccountStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        user = userRepository.save(user);

        Retailer retailer = Retailer.builder()
                .userId(user.getId())
                .businessName(request.getBusinessName().trim())
                .registrationNumber(request.getRegistrationNumber().trim())
                .contactEmail(request.getContactEmail().trim())
                .contactPhone(request.getContactPhone().trim())
                .address(request.getAddress().trim())
                .description(request.getDescription())
                .approvalStatus(ApprovalStatus.PENDING)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        retailer = retailerRepository.save(retailer);

        auditService.logAction(user.getId(), user.getEmail(), "RETAILER_REGISTERED", "Retailer", retailer.getId(),
                "Registered business: " + retailer.getBusinessName());

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        // Automatically sync and link any purchases registered with this verified email
        if (user.isEmailVerified() && user.getRole() == Role.CUSTOMER) {
            customerLinkingService.autoLinkPurchasesForUser(user);
        }

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .retailerId(retailer.getId())
                .retailerApprovalStatus(retailer.getApprovalStatus())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());

        User user = userRepository.findByEmailNormalized(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            String reasonMsg = (user.getStatusReason() != null && !user.getStatusReason().isBlank())
                    ? " Reason: " + user.getStatusReason() : "";
            throw new UnauthorizedException("Your account has been suspended by an administrator." + reasonMsg + " Please contact platform administration.");
        }

        if (user.getAccountStatus() == AccountStatus.INACTIVE || user.getAccountStatus() == AccountStatus.DEACTIVATED) {
            throw new BadRequestException("ACCOUNT_INACTIVE: Your account is currently inactive. Would you like to reactivate it?");
        }

        String retailerId = null;
        ApprovalStatus approvalStatus = null;

        if (user.getRole() == Role.RETAILER) {
            Retailer retailer = retailerRepository.findByUserId(user.getId()).orElse(null);
            if (retailer != null) {
                retailerId = retailer.getId();
                approvalStatus = retailer.getApprovalStatus();
            }
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        // Automatically sync and link any purchases registered with this verified email
        if (user.isEmailVerified() && user.getRole() == Role.CUSTOMER) {
            customerLinkingService.autoLinkPurchasesForUser(user);
        }

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .retailerId(retailerId)
                .retailerApprovalStatus(approvalStatus)
                .accountStatus(user.getAccountStatus())
                .statusReason(user.getStatusReason())
                .build();
    }

    public static class OtpResult {
        private final String rawOtp;
        private final boolean emailSent;

        public OtpResult(String rawOtp, boolean emailSent) {
            this.rawOtp = rawOtp;
            this.emailSent = emailSent;
        }

        public String getRawOtp() { return rawOtp; }
        public boolean isEmailSent() { return emailSent; }
    }

    public OtpResult sendEmailVerificationOtp(String email) {
        String normalizedEmail = EmailNormalizer.normalize(email);
        User user = userRepository.findByEmailNormalized(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return sendEmailVerificationOtp(user);
    }

    public OtpResult sendEmailVerificationOtp(User user) {
        Instant now = Instant.now();
        if (user.getLastOtpSentAt() != null &&
                Duration.between(user.getLastOtpSentAt(), now).getSeconds() < otpResendCooldownSeconds) {
            throw new BadRequestException("Please wait before requesting another OTP");
        }

        String rawOtp = OtpUtil.generateOtp();
        user.setOtpHash(passwordEncoder.encode(rawOtp));
        user.setOtpExpiresAt(now.plus(Duration.ofMinutes(otpExpiryMinutes)));
        user.setOtpAttempts(0);
        user.setLastOtpSentAt(now);
        userRepository.save(user);

        boolean emailSent = emailService.sendOtpEmail(user.getEmail(), rawOtp, "Account Email Verification");

        if (!emailSent) {
            throw new BadRequestException("We could not send the verification email. Please try again later.");
        }

        return new OtpResult(rawOtp, emailSent);
    }

    public void verifyEmailOtp(VerifyEmailOtpRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());
        User user = userRepository.findByEmailNormalized(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        if (user.isEmailVerified()) {
            return;
        }

        if (user.getOtpExpiresAt() == null || Instant.now().isAfter(user.getOtpExpiresAt())) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        if (user.getOtpAttempts() >= otpMaxAttempts) {
            throw new BadRequestException("Maximum OTP attempts reached. Please request a new OTP.");
        }

        user.setOtpAttempts(user.getOtpAttempts() + 1);

        if (!passwordEncoder.matches(request.getOtp(), user.getOtpHash())) {
            userRepository.save(user);
            throw new BadRequestException("Invalid OTP. Please check and try again.");
        }

        user.setEmailVerified(true);
        user.setOtpHash(null);
        user.setOtpExpiresAt(null);
        user.setOtpAttempts(0);
        userRepository.save(user);

        log.info("Email verified successfully for: {}", user.getEmail());

        // Automatically link all purchases associated with this verified email
        if (user.getRole() == Role.CUSTOMER) {
            customerLinkingService.autoLinkPurchasesForUser(user);
        }
    }

    public void requestPasswordReset(ForgotPasswordRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());

        // 1. Explicitly disallow secondary, alternative, or purchase-linked emails from receiving password reset OTPs
        if (userRepository.existsBySecondaryEmailsEmailNormalized(normalizedEmail)) {
            throw new BadRequestException("Password reset is only permitted using your primary registered account email address. Secondary and alternative email addresses cannot receive password reset OTPs.");
        }

        // 2. Validate email against registered user account primary email
        java.util.Optional<User> userOpt = userRepository.findByEmailNormalized(normalizedEmail);
        if (userOpt.isEmpty()) {
            if (purchaseRepository.existsByCustomerEmailNormalized(normalizedEmail)) {
                throw new BadRequestException("The provided email is associated with retail purchases but has no registered primary user account. Password reset OTPs can only be sent to registered account primary email addresses.");
            }
            throw new ResourceNotFoundException("No registered account found with primary email: " + request.getEmail());
        }

        User user = userOpt.get();

        // 3. Check account status
        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new BadRequestException("Your account is currently suspended. Please contact support.");
        }

        // 4. Enforce rate limiting / resend cooldown (60 seconds)
        Instant now = Instant.now();
        if (user.getLastPasswordResetOtpSentAt() != null &&
                Duration.between(user.getLastPasswordResetOtpSentAt(), now).getSeconds() < 60) {
            long remainingCooldown = 60 - Duration.between(user.getLastPasswordResetOtpSentAt(), now).getSeconds();
            throw new BadRequestException("Please wait " + remainingCooldown + " seconds before requesting another password reset OTP.");
        }

        // 5. Generate 6-digit numeric OTP and configure expiration & retry limits
        String rawOtp = OtpUtil.generateOtp();
        user.setPasswordResetOtpHash(passwordEncoder.encode(rawOtp));
        user.setPasswordResetOtpExpiresAt(now.plus(Duration.ofMinutes(5))); // 5-minute expiration
        user.setPasswordResetOtpAttempts(0); // reset retry limit counter
        user.setLastPasswordResetOtpSentAt(now);
        user.setPasswordResetVerified(false);
        user.setResetToken(null);
        user.setResetTokenExpiresAt(null);
        userRepository.save(user);

        // 6. Send OTP strictly to the primary registered email address (X)
        emailService.sendPasswordResetOtpEmail(user.getEmail(), rawOtp);

        auditService.logAction(user.getId(), user.getEmail(), "PASSWORD_RESET_OTP_REQUESTED", "USER", user.getId(),
                "Password reset OTP generated and sent to primary registered email: " + user.getEmail());

        log.info("=================================================");
        log.info("🔑 [FORGOT PASSWORD] 6-digit OTP generated for primary email {}: {}", user.getEmail(), rawOtp);
        log.info("=================================================");
    }

    public VerifyResetOtpResponse verifyPasswordResetOtp(VerifyResetOtpRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());

        // Reject secondary emails
        if (userRepository.existsBySecondaryEmailsEmailNormalized(normalizedEmail)) {
            throw new BadRequestException("Password reset is only permitted using your primary registered account email address.");
        }

        User user = userRepository.findByEmailNormalized(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No registered account found with primary email: " + request.getEmail()));

        Instant now = Instant.now();

        // Enforce OTP expiration (5 minutes)
        if (user.getPasswordResetOtpExpiresAt() == null || now.isAfter(user.getPasswordResetOtpExpiresAt())) {
            throw new BadRequestException("Password reset OTP has expired. Please request a new code.");
        }

        // Enforce OTP retry limits (max 5 attempts)
        int maxAttempts = 5;
        if (user.getPasswordResetOtpAttempts() >= maxAttempts) {
            throw new BadRequestException("Maximum OTP verification attempts (" + maxAttempts + ") exceeded. Please request a new password reset code.");
        }

        user.setPasswordResetOtpAttempts(user.getPasswordResetOtpAttempts() + 1);

        // Validate OTP hash
        if (user.getPasswordResetOtpHash() == null || !passwordEncoder.matches(request.getOtp().trim(), user.getPasswordResetOtpHash())) {
            userRepository.save(user);
            int remaining = Math.max(0, maxAttempts - user.getPasswordResetOtpAttempts());
            if (remaining == 0) {
                throw new BadRequestException("Invalid OTP code. Maximum verification attempts reached. Please request a new code.");
            }
            throw new BadRequestException("Invalid OTP code. " + remaining + " attempt(s) remaining.");
        }

        // OTP successfully verified: generate a verified single-use reset authorization token
        String resetToken = UUID.randomUUID().toString().replace("-", "");
        user.setPasswordResetOtpHash(null);
        user.setPasswordResetOtpExpiresAt(null);
        user.setPasswordResetOtpAttempts(0);
        user.setPasswordResetVerified(true);
        user.setResetToken(resetToken);
        user.setResetTokenExpiresAt(now.plus(Duration.ofMinutes(15))); // Valid for 15 minutes after verification
        userRepository.save(user);

        auditService.logAction(user.getId(), user.getEmail(), "PASSWORD_RESET_OTP_VERIFIED", "USER", user.getId(),
                "Password reset OTP successfully verified for primary email: " + user.getEmail());
        log.info("✅ Password reset OTP successfully verified for primary email: {}", user.getEmail());

        return new VerifyResetOtpResponse(resetToken, "OTP verified successfully. You may now set your new password.");
    }

    public void resetPassword(ResetPasswordRequest request) {
        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new BadRequestException("Password reset authorization token is required.");
        }

        String token = request.getToken().trim();
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset session. Please verify your OTP code again."));

        // ENFORCE: Allow password resets ONLY after successful OTP verification
        if (!user.isPasswordResetVerified()) {
            throw new BadRequestException("Password reset requires successful OTP verification. Please verify your OTP code first.");
        }

        if (user.getResetTokenExpiresAt() == null || Instant.now().isAfter(user.getResetTokenExpiresAt())) {
            user.setPasswordResetVerified(false);
            user.setResetToken(null);
            user.setResetTokenExpiresAt(null);
            userRepository.save(user);
            throw new BadRequestException("Password reset session has expired. Please request a new password reset OTP.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiresAt(null);
        user.setPasswordResetVerified(false);
        user.setPasswordResetOtpHash(null);
        user.setPasswordResetOtpExpiresAt(null);
        user.setPasswordResetOtpAttempts(0);
        userRepository.save(user);

        auditService.logAction(user.getId(), user.getEmail(), "PASSWORD_RESET_SUCCESS", "USER", user.getId(),
                "Password successfully reset after verified OTP for primary email: " + user.getEmail());
        log.info("🔒 Password successfully reset after verified OTP for primary email: {}", user.getEmail());
    }

    public UserResponse getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .accountStatus(user.getAccountStatus())
                .statusReason(user.getStatusReason())
                .statusChangedAt(user.getStatusChangedAt())
                .statusChangedBy(user.getStatusChangedBy())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        userRepository.save(user);

        log.info("Profile updated for user: {}", user.getEmail());

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .accountStatus(user.getAccountStatus())
                .statusReason(user.getStatusReason())
                .statusChangedAt(user.getStatusChangedAt())
                .statusChangedBy(user.getStatusChangedBy())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password changed by user: {}", user.getEmail());
    }

    @Transactional
    public void deactivateCustomerAccount(String customerId, String reason) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", customerId));

        if (user.getRole() != Role.CUSTOMER) {
            throw new BadRequestException("Only customer accounts can be deactivated through this action.");
        }

        user.setAccountStatus(AccountStatus.INACTIVE);
        user.setStatusReason(reason != null && !reason.isBlank() ? reason.trim() : "Deactivated by customer");
        user.setStatusChangedAt(Instant.now());
        user.setStatusChangedBy(user.getEmail());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        auditService.logAction(user.getId(), user.getEmail(), "CUSTOMER_SELF_DEACTIVATE", "User", user.getId(),
                "Customer self-deactivated account. Reason: " + user.getStatusReason());
    }

    @Transactional
    public AuthResponse reactivateAccount(ReactivateAccountRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());

        User user = userRepository.findByEmailNormalized(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            String reasonMsg = (user.getStatusReason() != null && !user.getStatusReason().isBlank())
                    ? " Reason: " + user.getStatusReason() : "";
            throw new UnauthorizedException("Suspended accounts cannot be reactivated automatically." + reasonMsg + " Please contact platform administration.");
        }

        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setStatusReason("Reactivated by customer login");
        user.setStatusChangedAt(Instant.now());
        user.setStatusChangedBy(user.getEmail());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        auditService.logAction(user.getId(), user.getEmail(), "CUSTOMER_REACTIVATE", "User", user.getId(),
                "Customer reactivated their account.");

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        // Automatically sync and link any purchases registered with this verified email
        if (user.isEmailVerified() && user.getRole() == Role.CUSTOMER) {
            customerLinkingService.autoLinkPurchasesForUser(user);
        }

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .accountStatus(user.getAccountStatus())
                .statusReason(user.getStatusReason())
                .build();
    }
}

