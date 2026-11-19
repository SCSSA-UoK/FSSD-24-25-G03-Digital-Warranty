package com.warrantrack.service;

import com.warrantrack.dto.linking.*;
import com.warrantrack.dto.purchase.PurchaseResponse;
import com.warrantrack.dto.warranty.WarrantyResponse;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.exception.UnauthorizedException;
import com.warrantrack.model.*;
import com.warrantrack.model.enums.AccountStatus;
import com.warrantrack.model.enums.LinkingStatus;
import com.warrantrack.model.enums.NotificationType;
import com.warrantrack.repository.AlternativeEmailVerificationRepository;
import com.warrantrack.repository.PurchaseRepository;
import com.warrantrack.repository.RetailerRepository;
import com.warrantrack.repository.UserRepository;
import com.warrantrack.repository.WarrantyRepository;
import com.warrantrack.util.EmailNormalizer;
import com.warrantrack.util.OtpUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class FindAndLinkPurchasesService {

    private static final Logger log = LoggerFactory.getLogger(FindAndLinkPurchasesService.class);

    private final UserRepository userRepository;
    private final PurchaseRepository purchaseRepository;
    private final WarrantyRepository warrantyRepository;
    private final RetailerRepository retailerRepository;
    private final AlternativeEmailVerificationRepository verificationRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final PurchaseService purchaseService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${app.otp.max-attempts:5}")
    private int otpMaxAttempts;

    @Value("${app.otp.resend-cooldown-seconds:60}")
    private int otpResendCooldownSeconds;

    public FindAndLinkPurchasesService(UserRepository userRepository,
                                      PurchaseRepository purchaseRepository,
                                      WarrantyRepository warrantyRepository,
                                      RetailerRepository retailerRepository,
                                      AlternativeEmailVerificationRepository verificationRepository,
                                      EmailService emailService,
                                      NotificationService notificationService,
                                      AuditService auditService,
                                      PurchaseService purchaseService,
                                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.purchaseRepository = purchaseRepository;
        this.warrantyRepository = warrantyRepository;
        this.retailerRepository = retailerRepository;
        this.verificationRepository = verificationRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.purchaseService = purchaseService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Sends a 6-digit OTP to the specified alternative email address.
     * Enforces rate limiting, cooldown, and security checks.
     */
    @Transactional
    public AltEmailOtpResponse sendOtp(String userId, String rawEmail) {
        if (rawEmail == null || rawEmail.trim().isBlank()) {
            throw new BadRequestException("Please enter a valid email address.");
        }

        String normalizedEmail = EmailNormalizer.normalize(rawEmail);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Your customer account is currently not active.");
        }

        if (normalizedEmail.equalsIgnoreCase(user.getEmailNormalized())) {
            throw new BadRequestException("This is already your primary account email. All purchases for your primary email are automatically linked to your account.");
        }

        Instant now = Instant.now();
        AlternativeEmailVerification verification = verificationRepository
                .findByUserIdAndEmailNormalized(userId, normalizedEmail)
                .orElse(null);

        if (verification != null && verification.getLastOtpSentAt() != null) {
            long secondsPassed = Duration.between(verification.getLastOtpSentAt(), now).getSeconds();
            if (secondsPassed < otpResendCooldownSeconds) {
                long remaining = otpResendCooldownSeconds - secondsPassed;
                throw new BadRequestException("Please wait " + remaining + " second(s) before requesting a new verification code.");
            }
        }

        if (verification == null) {
            verification = new AlternativeEmailVerification(userId, rawEmail.trim(), normalizedEmail);
        }

        String rawOtp = OtpUtil.generateOtp();
        verification.setOtpHash(passwordEncoder.encode(rawOtp));
        verification.setOtpExpiresAt(now.plus(Duration.ofMinutes(otpExpiryMinutes)));
        verification.setOtpAttempts(0);
        verification.setLastOtpSentAt(now);
        verification.setVerified(false);
        verification.setVerificationToken(null);
        verification.setUpdatedAt(now);
        verificationRepository.save(verification);

        // Attempt sending email
        boolean sent = emailService.sendOtpEmail(rawEmail.trim(), rawOtp, "Alternative Email Ownership Verification");
        log.info("🔑 [Find & Link Purchases] OTP generated for user {} and alt-email {}: {}", user.getEmail(), rawEmail.trim(), rawOtp);

        String message = sent
                ? "A 6-digit verification code has been sent to " + rawEmail.trim() + ". It expires in " + otpExpiryMinutes + " minutes."
                : "Verification code generated for " + rawEmail.trim() + " (expires in " + otpExpiryMinutes + " minutes).";

        return new AltEmailOtpResponse(rawEmail.trim(), message, otpResendCooldownSeconds, otpExpiryMinutes);
    }

    /**
     * Verifies the OTP entered by the customer for the alternative email.
     * On success, generates a secure verification token and optionally saves the email as a secondary email.
     */
    @Transactional
    public AltEmailVerificationResponse verifyOtp(String userId, VerifyAltEmailOtpRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Your customer account is currently not active.");
        }

        AlternativeEmailVerification verification = verificationRepository
                .findByUserIdAndEmailNormalized(userId, normalizedEmail)
                .orElseThrow(() -> new BadRequestException("No verification request found for " + request.getEmail() + ". Please request a verification code first."));

        if (verification.getOtpExpiresAt() == null || Instant.now().isAfter(verification.getOtpExpiresAt())) {
            throw new BadRequestException("Verification code has expired. Please request a new code.");
        }

        if (verification.getOtpAttempts() >= otpMaxAttempts) {
            throw new BadRequestException("Maximum verification attempts (" + otpMaxAttempts + ") reached. Please request a new verification code.");
        }

        verification.setOtpAttempts(verification.getOtpAttempts() + 1);

        if (!passwordEncoder.matches(request.getOtp().trim(), verification.getOtpHash())) {
            verificationRepository.save(verification);
            int remaining = otpMaxAttempts - verification.getOtpAttempts();
            if (remaining > 0) {
                throw new BadRequestException("Invalid verification code. You have " + remaining + " attempt(s) remaining.");
            } else {
                throw new BadRequestException("Maximum verification attempts reached. Please request a new verification code.");
            }
        }

        // Verification successful
        verification.setVerified(true);
        verification.setVerifiedAt(Instant.now());
        verification.setOtpHash(null);
        verification.setOtpExpiresAt(null);
        verification.setOtpAttempts(0);
        String token = UUID.randomUUID().toString();
        verification.setVerificationToken(token);
        verification.setUpdatedAt(Instant.now());
        verificationRepository.save(verification);

        boolean savedSecondary = false;
        if (request.isSaveAsSecondary()) {
            user.addSecondaryEmail(request.getEmail().trim(), normalizedEmail);
            user.setUpdatedAt(Instant.now());
            userRepository.save(user);
            savedSecondary = true;
        }

        // Auto-link any eligible purchases for this verified email
        autoLinkEligiblePurchases(user, normalizedEmail);

        auditService.logAction(user.getId(), user.getEmail(), "ALT_EMAIL_VERIFIED", "User", user.getId(),
                "Verified alternative email: " + request.getEmail().trim() + (savedSecondary ? " (Saved as secondary)" : ""));

        return new AltEmailVerificationResponse(
                request.getEmail().trim(),
                token,
                savedSecondary,
                "Ownership of " + request.getEmail().trim() + " verified successfully!"
        );
    }

    /**
     * Checks whether the user has verified ownership of the given normalized email.
     * Returns true if email is saved in user's secondaryEmails, or verified in verificationRepository.
     */
    public boolean checkEmailOwnership(User user, String normalizedEmail, String token) {
        if (user == null || normalizedEmail == null) return false;

        // 1. Is it saved in the user's verified secondary emails?
        if (user.hasSecondaryEmail(normalizedEmail)) {
            return true;
        }

        // 2. Is there an active verification record with matching token or recently verified?
        Optional<AlternativeEmailVerification> opt = verificationRepository
                .findByUserIdAndEmailNormalized(user.getId(), normalizedEmail);

        if (opt.isPresent()) {
            AlternativeEmailVerification ver = opt.get();
            if (ver.isVerified()) {
                if (token != null && !token.isBlank()) {
                    return token.equals(ver.getVerificationToken());
                }
                // If no token passed, allow if verified within 24 hours
                if (ver.getVerifiedAt() != null) {
                    return Duration.between(ver.getVerifiedAt(), Instant.now()).toHours() < 24;
                }
            }
        }

        return false;
    }

    /**
     * Retrieves all purchases associated with the verified alternative email,
     * including detailed linking status: Available to Link, Already Linked, or Linked to Another Account.
     */
    public FindPurchasesResultResponse getFoundPurchases(String userId, String rawEmail, String token) {
        String normalizedEmail = EmailNormalizer.normalize(rawEmail);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!checkEmailOwnership(user, normalizedEmail, token)) {
            throw new UnauthorizedException("Ownership of " + rawEmail + " has not been verified. Please verify this email via OTP first.");
        }

        List<Purchase> purchases = purchaseRepository.findByCustomerEmailNormalized(normalizedEmail);
        List<AltPurchaseItemResponse> items = new ArrayList<>();

        int availableCount = 0;
        int alreadyLinkedCount = 0;
        int linkedToOtherCount = 0;

        for (Purchase purchase : purchases) {
            AltPurchaseItemResponse item = new AltPurchaseItemResponse();
            item.setId(purchase.getId());
            item.setRetailerId(purchase.getRetailerId());
            item.setProductId(purchase.getProductId());
            item.setProductName(purchase.getProductName());
            item.setProductBrand(purchase.getProductBrand());
            item.setProductModel(purchase.getProductModel());
            item.setUnitPrice(purchase.getUnitPrice());
            item.setQuantity(purchase.getQuantity());
            item.setPurchaseDate(purchase.getPurchaseDate());
            item.setInvoiceNumber(purchase.getInvoiceNumber());
            item.setPurchaseReference(purchase.getPurchaseReference());
            item.setSerialNumber(purchase.getSerialNumber());
            item.setHasWarranty(purchase.isHasWarranty());
            item.setCustomerEmail(purchase.getCustomerEmail());

            // Lookup retailer business name
            if (purchase.getRetailerId() != null) {
                retailerRepository.findById(purchase.getRetailerId()).ifPresent(r -> {
                    item.setRetailerBusinessName(r.getBusinessName());
                });
            }

            // Determine Linking Status
            if (purchase.getCustomerId() != null && purchase.getCustomerId().equals(userId)) {
                // Case 1: Already linked to current customer's account
                item.setLinkingStatus("ALREADY_LINKED");
                item.setStatusLabel("Already Linked");
                item.setStatusDescription("This purchase and its warranty certificate are already linked to your WarranTrack account.");
                item.setCanLink(false);
                alreadyLinkedCount++;
            } else if (purchase.getCustomerId() != null && !purchase.getCustomerId().equals(userId)) {
                // Case 2: Claimed by another customer account (Prevent unauthorized claims)
                item.setLinkingStatus("LINKED_TO_OTHER");
                item.setStatusLabel("Linked to Another Account");
                item.setStatusDescription("This purchase was already claimed by another customer account and cannot be linked.");
                item.setCanLink(false);
                // Mask sensitive serial number for privacy
                if (item.getSerialNumber() != null && item.getSerialNumber().length() > 4) {
                    item.setSerialNumber("••••••••" + item.getSerialNumber().substring(item.getSerialNumber().length() - 4));
                }
                linkedToOtherCount++;
            } else {
                // Case 3: Eligible unclaimed purchase
                item.setLinkingStatus("AVAILABLE_TO_LINK");
                item.setStatusLabel("Available to Link");
                item.setStatusDescription("Eligible to be linked to your WarranTrack wallet and digital warranty dashboard.");
                item.setCanLink(true);
                availableCount++;
            }

            // Lookup associated warranty certificate
            warrantyRepository.findByPurchaseId(purchase.getId()).ifPresent(warranty -> {
                WarrantySummaryResponse wSummary = new WarrantySummaryResponse(
                        warranty.getId(),
                        warranty.getStatus() != null ? warranty.getStatus().name() : "ACTIVE",
                        warranty.getStartDate(),
                        warranty.getExpiryDate(),
                        warranty.getWarrantyDurationSnapshot(),
                        warranty.getWarrantyUnitSnapshot() != null ? warranty.getWarrantyUnitSnapshot().name() : null,
                        warranty.getQrToken()
                );
                item.setWarranty(wSummary);
            });

            items.add(item);
        }

        // Sort items: Available to Link first, then Already Linked, then Linked to Other
        items.sort((a, b) -> {
            int rankA = "AVAILABLE_TO_LINK".equals(a.getLinkingStatus()) ? 0 : ("ALREADY_LINKED".equals(a.getLinkingStatus()) ? 1 : 2);
            int rankB = "AVAILABLE_TO_LINK".equals(b.getLinkingStatus()) ? 0 : ("ALREADY_LINKED".equals(b.getLinkingStatus()) ? 1 : 2);
            if (rankA != rankB) return Integer.compare(rankA, rankB);
            if (a.getPurchaseDate() != null && b.getPurchaseDate() != null) {
                return b.getPurchaseDate().compareTo(a.getPurchaseDate());
            }
            return 0;
        });

        boolean isSavedSecondary = user.hasSecondaryEmail(normalizedEmail);

        return new FindPurchasesResultResponse(
                rawEmail.trim(),
                isSavedSecondary,
                items.size(),
                availableCount,
                alreadyLinkedCount,
                linkedToOtherCount,
                items
        );
    }

    /**
     * Links a single eligible unlinked purchase to the customer's account.
     * Validates email ownership, purchase eligibility, and prevents claiming purchases belonging to other accounts.
     * Does NOT alter the original retailer purchase record (preserves customerEmail, retailerId, etc.).
     */
    @Transactional
    public PurchaseResponse linkPurchase(String userId, LinkAltEmailPurchaseRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Your customer account is currently not active.");
        }

        if (!checkEmailOwnership(user, normalizedEmail, request.getVerificationToken())) {
            throw new UnauthorizedException("Email ownership not verified. Please verify this email via OTP first.");
        }

        Purchase purchase = purchaseRepository.findById(request.getPurchaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase", "id", request.getPurchaseId()));

        // Security check 1: Purchase must match the verified email
        if (!normalizedEmail.equalsIgnoreCase(purchase.getCustomerEmailNormalized())) {
            throw new BadRequestException("Purchase email (" + purchase.getCustomerEmail() + ") does not match verified alternative email (" + request.getEmail() + ").");
        }

        // Security check 2: Prevent claiming if already owned by another account
        if (purchase.getCustomerId() != null && !purchase.getCustomerId().equals(userId)) {
            throw new BadRequestException("This purchase has already been claimed by another customer account.");
        }

        // Duplicate prevention / Idempotency check:
        if (purchase.getCustomerId() != null && purchase.getCustomerId().equals(userId)
                && LinkingStatus.LINKED.equals(purchase.getLinkingStatus())) {
            return purchaseService.mapToResponse(purchase);
        }

        // Link purchase to customer (preserving retailer original records!)
        purchase.setCustomerId(userId);
        purchase.setLinkingStatus(LinkingStatus.LINKED);
        purchase.setUpdatedAt(Instant.now());
        purchase = purchaseRepository.save(purchase);

        // Link matching warranty certificate if present
        Warranty warranty = warrantyRepository.findByPurchaseId(purchase.getId()).orElse(null);
        if (warranty != null) {
            warranty.setCustomerId(userId);
            warranty.setUpdatedAt(Instant.now());
            warrantyRepository.save(warranty);

            notificationService.sendNotification(
                    userId,
                    NotificationType.PURCHASE_LINKED,
                    String.format("Purchase '%s' (%s) and digital warranty certificate have been linked to your account via %s.",
                            purchase.getPurchaseReference(),
                            purchase.getProductName() != null ? purchase.getProductName() : "Product",
                            request.getEmail().trim()),
                    warranty.getId(),
                    "Warranty"
            );
        } else {
            notificationService.sendNotification(
                    userId,
                    NotificationType.PURCHASE_LINKED,
                    String.format("Purchase '%s' (%s) has been linked to your account via %s.",
                            purchase.getPurchaseReference(),
                            purchase.getProductName() != null ? purchase.getProductName() : "Product",
                            request.getEmail().trim()),
                    purchase.getId(),
                    "Purchase"
            );
        }

        auditService.logAction(userId, user.getEmail(), "PURCHASE_LINKED_ALT_EMAIL", "Purchase", purchase.getId(),
                "Linked purchase " + purchase.getPurchaseReference() + " via verified alternative email " + request.getEmail().trim());

        return purchaseService.mapToResponse(purchase);
    }

    /**
     * Links all eligible unlinked purchases for a verified alternative email address.
     */
    @Transactional
    public int linkAllPurchases(String userId, LinkAllAltEmailPurchasesRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Your customer account is currently not active.");
        }

        if (!checkEmailOwnership(user, normalizedEmail, request.getVerificationToken())) {
            throw new UnauthorizedException("Email ownership not verified. Please verify this email via OTP first.");
        }

        return autoLinkEligiblePurchases(user, normalizedEmail);
    }

    /**
     * Saves a verified alternative email as a secondary email on the customer's account for future purchase matching.
     */
    @Transactional
    public void saveSecondaryEmail(String userId, SaveSecondaryEmailRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!checkEmailOwnership(user, normalizedEmail, request.getVerificationToken())) {
            throw new UnauthorizedException("Email ownership not verified. Please verify this email via OTP first.");
        }

        if (normalizedEmail.equalsIgnoreCase(user.getEmailNormalized())) {
            throw new BadRequestException("Cannot add your primary account email as a secondary email.");
        }

        user.addSecondaryEmail(request.getEmail().trim(), normalizedEmail);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        // Auto-link any matching unclaimed purchases
        autoLinkEligiblePurchases(user, normalizedEmail);

        auditService.logAction(userId, user.getEmail(), "SECONDARY_EMAIL_SAVED", "User", userId,
                "Saved verified secondary email: " + request.getEmail().trim());
    }

    /**
     * Returns the customer's saved secondary emails with purchase count statistics.
     */
    public List<SecondaryEmailDto> getSecondaryEmails(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<SecondaryEmail> secondaryEmails = user.getSecondaryEmails();
        List<SecondaryEmailDto> result = new ArrayList<>();

        for (SecondaryEmail sec : secondaryEmails) {
            String norm = sec.getEmailNormalized();
            List<Purchase> purchases = purchaseRepository.findByCustomerEmailNormalized(norm);

            int linked = (int) purchases.stream()
                    .filter(p -> userId.equals(p.getCustomerId()) && LinkingStatus.LINKED.equals(p.getLinkingStatus()))
                    .count();

            int available = (int) purchases.stream()
                    .filter(p -> p.getCustomerId() == null || !LinkingStatus.LINKED.equals(p.getLinkingStatus()))
                    .count();

            result.add(new SecondaryEmailDto(sec.getEmail(), sec.getVerifiedAt(), linked, available));
        }

        return result;
    }

    /**
     * Removes a secondary email from the customer's saved list.
     */
    @Transactional
    public void removeSecondaryEmail(String userId, String rawEmail) {
        String normalizedEmail = EmailNormalizer.normalize(rawEmail);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean removed = user.removeSecondaryEmail(normalizedEmail);
        if (removed) {
            user.setUpdatedAt(Instant.now());
            userRepository.save(user);

            // Clean up verification record
            verificationRepository.deleteByUserIdAndEmailNormalized(userId, normalizedEmail);

            auditService.logAction(userId, user.getEmail(), "SECONDARY_EMAIL_REMOVED", "User", userId,
                    "Removed secondary email: " + rawEmail.trim());
        }
    }

    /**
     * Helper to auto-link all eligible unclaimed purchases for a verified email to the user.
     */
    private int autoLinkEligiblePurchases(User user, String normalizedEmail) {
        List<Purchase> purchases = purchaseRepository.findByCustomerEmailNormalized(normalizedEmail);
        int linkedCount = 0;

        for (Purchase purchase : purchases) {
            // Skip if claimed by another user
            if (purchase.getCustomerId() != null && !purchase.getCustomerId().equals(user.getId())) {
                continue;
            }

            // Skip if already linked to this user
            if (user.getId().equals(purchase.getCustomerId()) && LinkingStatus.LINKED.equals(purchase.getLinkingStatus())) {
                continue;
            }

            purchase.setCustomerId(user.getId());
            purchase.setLinkingStatus(LinkingStatus.LINKED);
            purchase.setUpdatedAt(Instant.now());
            purchaseRepository.save(purchase);

            Warranty warranty = warrantyRepository.findByPurchaseId(purchase.getId()).orElse(null);
            if (warranty != null) {
                warranty.setCustomerId(user.getId());
                warranty.setUpdatedAt(Instant.now());
                warrantyRepository.save(warranty);

                notificationService.sendNotification(
                        user.getId(),
                        NotificationType.PURCHASE_LINKED,
                        String.format("Purchase '%s' (%s) and digital warranty certificate have been linked to your account.",
                                purchase.getPurchaseReference(),
                                purchase.getProductName() != null ? purchase.getProductName() : "Product"),
                        warranty.getId(),
                        "Warranty"
                );
            }

            linkedCount++;
        }

        if (linkedCount > 0) {
            log.info("Linked {} purchases for user {} via email {}", linkedCount, user.getEmail(), normalizedEmail);
        }

        return linkedCount;
    }
}
