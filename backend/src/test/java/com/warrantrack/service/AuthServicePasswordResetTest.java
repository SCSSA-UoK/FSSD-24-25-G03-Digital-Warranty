package com.warrantrack.service;

import com.warrantrack.dto.auth.*;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.model.User;
import com.warrantrack.model.enums.AccountStatus;
import com.warrantrack.model.enums.Role;
import com.warrantrack.repository.PurchaseRepository;
import com.warrantrack.repository.RetailerRepository;
import com.warrantrack.repository.UserRepository;
import com.warrantrack.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServicePasswordResetTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RetailerRepository retailerRepository;

    @Mock
    private PurchaseRepository purchaseRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuditService auditService;

    @Mock
    private EmailService emailService;

    @Mock
    private CustomerLinkingService customerLinkingService;

    @InjectMocks
    private AuthService authService;

    private User primaryUser;

    @BeforeEach
    void setUp() {
        primaryUser = User.builder()
                .id("user-100")
                .name("Alice Primary")
                .email("alice@example.com")
                .emailNormalized("alice@example.com")
                .passwordHash("encoded-old-password")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .accountStatus(AccountStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Should reject password reset request if email is a secondary/alternative email")
    void testRequestPasswordReset_RejectsSecondaryEmail() {
        String secondaryEmail = "alt.alice@example.com";
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail(secondaryEmail);

        when(userRepository.existsBySecondaryEmailsEmailNormalized(secondaryEmail)).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                authService.requestPasswordReset(request)
        );

        assertTrue(ex.getMessage().contains("only permitted using your primary registered account email"));
        verify(emailService, never()).sendPasswordResetOtpEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("Should reject password reset request if email is a purchase-linked email with no registered account")
    void testRequestPasswordReset_RejectsPurchaseLinkedOnlyEmail() {
        String purchaseEmail = "retail.buyer@example.com";
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail(purchaseEmail);

        when(userRepository.existsBySecondaryEmailsEmailNormalized(purchaseEmail)).thenReturn(false);
        when(userRepository.findByEmailNormalized(purchaseEmail)).thenReturn(Optional.empty());
        when(purchaseRepository.existsByCustomerEmailNormalized(purchaseEmail)).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                authService.requestPasswordReset(request)
        );

        assertTrue(ex.getMessage().contains("associated with retail purchases but has no registered primary user account"));
        verify(emailService, never()).sendPasswordResetOtpEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("Should reject password reset request if email has no registered account at all")
    void testRequestPasswordReset_RejectsUnknownEmail() {
        String unknownEmail = "unknown@example.com";
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail(unknownEmail);

        when(userRepository.existsBySecondaryEmailsEmailNormalized(unknownEmail)).thenReturn(false);
        when(userRepository.findByEmailNormalized(unknownEmail)).thenReturn(Optional.empty());
        when(purchaseRepository.existsByCustomerEmailNormalized(unknownEmail)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () ->
                authService.requestPasswordReset(request)
        );
        verify(emailService, never()).sendPasswordResetOtpEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("Should send 6-digit OTP only to primary registered email address")
    void testRequestPasswordReset_SendsOtpToPrimaryEmail() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("alice@example.com");

        when(userRepository.existsBySecondaryEmailsEmailNormalized("alice@example.com")).thenReturn(false);
        when(userRepository.findByEmailNormalized("alice@example.com")).thenReturn(Optional.of(primaryUser));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-otp");
        when(emailService.sendPasswordResetOtpEmail(eq("alice@example.com"), anyString())).thenReturn(true);

        authService.requestPasswordReset(request);

        assertEquals("hashed-otp", primaryUser.getPasswordResetOtpHash());
        assertNotNull(primaryUser.getPasswordResetOtpExpiresAt());
        assertTrue(primaryUser.getPasswordResetOtpExpiresAt().isAfter(Instant.now()));
        assertEquals(0, primaryUser.getPasswordResetOtpAttempts());
        assertFalse(primaryUser.isPasswordResetVerified());

        verify(emailService).sendPasswordResetOtpEmail(eq("alice@example.com"), matches("^\\d{6}$"));
        verify(userRepository).save(primaryUser);
    }

    @Test
    @DisplayName("Should enforce 60-second cooldown on password reset OTP requests")
    void testRequestPasswordReset_EnforcesCooldown() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("alice@example.com");

        primaryUser.setLastPasswordResetOtpSentAt(Instant.now().minusSeconds(20)); // only 20s ago

        when(userRepository.existsBySecondaryEmailsEmailNormalized("alice@example.com")).thenReturn(false);
        when(userRepository.findByEmailNormalized("alice@example.com")).thenReturn(Optional.of(primaryUser));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                authService.requestPasswordReset(request)
        );

        assertTrue(ex.getMessage().contains("Please wait"));
        verify(emailService, never()).sendPasswordResetOtpEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("Should reject verification if OTP has expired")
    void testVerifyPasswordResetOtp_RejectsExpiredOtp() {
        primaryUser.setPasswordResetOtpHash("hash");
        primaryUser.setPasswordResetOtpExpiresAt(Instant.now().minus(Duration.ofMinutes(1))); // expired
        primaryUser.setPasswordResetOtpAttempts(0);

        when(userRepository.existsBySecondaryEmailsEmailNormalized("alice@example.com")).thenReturn(false);
        when(userRepository.findByEmailNormalized("alice@example.com")).thenReturn(Optional.of(primaryUser));

        VerifyResetOtpRequest request = new VerifyResetOtpRequest("alice@example.com", "123456");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                authService.verifyPasswordResetOtp(request)
        );

        assertTrue(ex.getMessage().contains("OTP has expired"));
    }

    @Test
    @DisplayName("Should enforce maximum 5 retry attempts for OTP verification")
    void testVerifyPasswordResetOtp_EnforcesRetryLimit() {
        primaryUser.setPasswordResetOtpHash("hash");
        primaryUser.setPasswordResetOtpExpiresAt(Instant.now().plus(Duration.ofMinutes(4)));
        primaryUser.setPasswordResetOtpAttempts(5); // already 5 attempts

        when(userRepository.existsBySecondaryEmailsEmailNormalized("alice@example.com")).thenReturn(false);
        when(userRepository.findByEmailNormalized("alice@example.com")).thenReturn(Optional.of(primaryUser));

        VerifyResetOtpRequest request = new VerifyResetOtpRequest("alice@example.com", "123456");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                authService.verifyPasswordResetOtp(request)
        );

        assertTrue(ex.getMessage().contains("Maximum OTP verification attempts"));
    }

    @Test
    @DisplayName("Should increment attempts and return remaining count on invalid OTP")
    void testVerifyPasswordResetOtp_IncrementsAttemptsOnMismatch() {
        primaryUser.setPasswordResetOtpHash("hash-999999");
        primaryUser.setPasswordResetOtpExpiresAt(Instant.now().plus(Duration.ofMinutes(4)));
        primaryUser.setPasswordResetOtpAttempts(1);

        when(userRepository.existsBySecondaryEmailsEmailNormalized("alice@example.com")).thenReturn(false);
        when(userRepository.findByEmailNormalized("alice@example.com")).thenReturn(Optional.of(primaryUser));
        when(passwordEncoder.matches("123456", "hash-999999")).thenReturn(false);

        VerifyResetOtpRequest request = new VerifyResetOtpRequest("alice@example.com", "123456");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                authService.verifyPasswordResetOtp(request)
        );

        assertEquals(2, primaryUser.getPasswordResetOtpAttempts());
        assertTrue(ex.getMessage().contains("3 attempt(s) remaining"));
        verify(userRepository).save(primaryUser);
    }

    @Test
    @DisplayName("Should successfully verify valid OTP and generate reset authorization token")
    void testVerifyPasswordResetOtp_SucceedsForValidOtp() {
        primaryUser.setPasswordResetOtpHash("hash-123456");
        primaryUser.setPasswordResetOtpExpiresAt(Instant.now().plus(Duration.ofMinutes(4)));
        primaryUser.setPasswordResetOtpAttempts(0);

        when(userRepository.existsBySecondaryEmailsEmailNormalized("alice@example.com")).thenReturn(false);
        when(userRepository.findByEmailNormalized("alice@example.com")).thenReturn(Optional.of(primaryUser));
        when(passwordEncoder.matches("123456", "hash-123456")).thenReturn(true);

        VerifyResetOtpRequest request = new VerifyResetOtpRequest("alice@example.com", "123456");

        VerifyResetOtpResponse response = authService.verifyPasswordResetOtp(request);

        assertNotNull(response.getResetToken());
        assertTrue(primaryUser.isPasswordResetVerified());
        assertNotNull(primaryUser.getResetToken());
        assertNull(primaryUser.getPasswordResetOtpHash());
        assertNull(primaryUser.getPasswordResetOtpExpiresAt());

        verify(userRepository).save(primaryUser);
    }

    @Test
    @DisplayName("Should strictly block password reset if OTP was not successfully verified first")
    void testResetPassword_BlocksWithoutPriorOtpVerification() {
        primaryUser.setResetToken("unverified-token");
        primaryUser.setResetTokenExpiresAt(Instant.now().plus(Duration.ofMinutes(10)));
        primaryUser.setPasswordResetVerified(false); // NOT verified!

        when(userRepository.findByResetToken("unverified-token")).thenReturn(Optional.of(primaryUser));

        ResetPasswordRequest request = new ResetPasswordRequest("unverified-token", "NewPassword123!");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                authService.resetPassword(request)
        );

        assertTrue(ex.getMessage().contains("requires successful OTP verification"));
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("Should successfully reset password after OTP verification")
    void testResetPassword_SucceedsAfterOtpVerification() {
        primaryUser.setResetToken("valid-verified-token");
        primaryUser.setResetTokenExpiresAt(Instant.now().plus(Duration.ofMinutes(10)));
        primaryUser.setPasswordResetVerified(true); // Successfully verified!

        when(userRepository.findByResetToken("valid-verified-token")).thenReturn(Optional.of(primaryUser));
        when(passwordEncoder.encode("BrandNewPassword123!")).thenReturn("encoded-new-password");

        ResetPasswordRequest request = new ResetPasswordRequest("valid-verified-token", "BrandNewPassword123!");

        authService.resetPassword(request);

        assertEquals("encoded-new-password", primaryUser.getPasswordHash());
        assertNull(primaryUser.getResetToken());
        assertNull(primaryUser.getResetTokenExpiresAt());
        assertFalse(primaryUser.isPasswordResetVerified());

        verify(userRepository).save(primaryUser);
    }
}
