package com.warrantrack.service;

import com.warrantrack.dto.linking.*;
import com.warrantrack.dto.purchase.PurchaseResponse;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.exception.UnauthorizedException;
import com.warrantrack.model.*;
import com.warrantrack.model.enums.AccountStatus;
import com.warrantrack.model.enums.LinkingStatus;
import com.warrantrack.model.enums.Role;
import com.warrantrack.repository.AlternativeEmailVerificationRepository;
import com.warrantrack.repository.PurchaseRepository;
import com.warrantrack.repository.RetailerRepository;
import com.warrantrack.repository.UserRepository;
import com.warrantrack.repository.WarrantyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FindAndLinkPurchasesServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PurchaseRepository purchaseRepository;

    @Mock
    private WarrantyRepository warrantyRepository;

    @Mock
    private RetailerRepository retailerRepository;

    @Mock
    private AlternativeEmailVerificationRepository verificationRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditService auditService;

    @Mock
    private PurchaseService purchaseService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private FindAndLinkPurchasesService findService;

    private User testUser;
    private final String userId = "user-123";
    private final String primaryEmail = "primary@customer.com";
    private final String altEmail = "alt@customer.com";
    private final String altEmailNorm = "alt@customer.com";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(findService, "otpExpiryMinutes", 5);
        ReflectionTestUtils.setField(findService, "otpMaxAttempts", 5);
        ReflectionTestUtils.setField(findService, "otpResendCooldownSeconds", 60);

        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail(primaryEmail);
        testUser.setEmailNormalized(primaryEmail);
        testUser.setName("Test Customer");
        testUser.setRole(Role.CUSTOMER);
        testUser.setAccountStatus(AccountStatus.ACTIVE);
        testUser.setEmailVerified(true);
        testUser.setSecondaryEmails(new ArrayList<>());
    }

    @Test
    @DisplayName("sendOtp: Successfully generates and sends OTP to alternative email")
    void sendOtp_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(verificationRepository.findByUserIdAndEmailNormalized(userId, altEmailNorm)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-otp");
        when(emailService.sendOtpEmail(eq(altEmail), anyString(), anyString())).thenReturn(true);
        when(verificationRepository.save(any(AlternativeEmailVerification.class))).thenAnswer(i -> i.getArgument(0));

        AltEmailOtpResponse response = findService.sendOtp(userId, altEmail);

        assertNotNull(response);
        assertEquals(altEmail, response.getEmail());
        assertEquals(60, response.getCooldownSeconds());
        assertEquals(5, response.getExpiryMinutes());
        verify(emailService, times(1)).sendOtpEmail(eq(altEmail), anyString(), anyString());
        verify(verificationRepository, times(1)).save(any(AlternativeEmailVerification.class));
    }

    @Test
    @DisplayName("sendOtp: Rejects when attempting to send OTP to primary account email")
    void sendOtp_RejectsPrimaryEmail() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                findService.sendOtp(userId, primaryEmail));

        assertTrue(ex.getMessage().contains("primary account email"));
        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("sendOtp: Rejects when cooldown is still active")
    void sendOtp_RejectsCooldownActive() {
        AlternativeEmailVerification existing = new AlternativeEmailVerification(userId, altEmail, altEmailNorm);
        existing.setLastOtpSentAt(Instant.now().minus(20, ChronoUnit.SECONDS)); // 20s ago, cooldown is 60s

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(verificationRepository.findByUserIdAndEmailNormalized(userId, altEmailNorm)).thenReturn(Optional.of(existing));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                findService.sendOtp(userId, altEmail));

        assertTrue(ex.getMessage().contains("Please wait"));
        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("verifyOtp: Successfully verifies valid OTP and saves as secondary email")
    void verifyOtp_Success_SavesSecondary() {
        AlternativeEmailVerification existing = new AlternativeEmailVerification(userId, altEmail, altEmailNorm);
        existing.setOtpHash("encoded-123456");
        existing.setOtpExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));
        existing.setOtpAttempts(0);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(verificationRepository.findByUserIdAndEmailNormalized(userId, altEmailNorm)).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("123456", "encoded-123456")).thenReturn(true);
        when(verificationRepository.save(any(AlternativeEmailVerification.class))).thenAnswer(i -> i.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(purchaseRepository.findByCustomerEmailNormalized(altEmailNorm)).thenReturn(new ArrayList<>());

        VerifyAltEmailOtpRequest req = new VerifyAltEmailOtpRequest(altEmail, "123456", true);
        AltEmailVerificationResponse response = findService.verifyOtp(userId, req);

        assertNotNull(response);
        assertEquals(altEmail, response.getEmail());
        assertTrue(response.isSavedAsSecondary());
        assertNotNull(response.getVerificationToken());

        // Check user has secondary email added
        assertTrue(testUser.hasSecondaryEmail(altEmailNorm));
        verify(userRepository, times(1)).save(testUser);
        verify(auditService, times(1)).logAction(eq(userId), anyString(), eq("ALT_EMAIL_VERIFIED"), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("verifyOtp: Rejects when OTP is expired")
    void verifyOtp_RejectsExpiredOtp() {
        AlternativeEmailVerification existing = new AlternativeEmailVerification(userId, altEmail, altEmailNorm);
        existing.setOtpHash("encoded-123456");
        existing.setOtpExpiresAt(Instant.now().minus(1, ChronoUnit.MINUTES)); // Expired

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(verificationRepository.findByUserIdAndEmailNormalized(userId, altEmailNorm)).thenReturn(Optional.of(existing));

        VerifyAltEmailOtpRequest req = new VerifyAltEmailOtpRequest(altEmail, "123456", true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                findService.verifyOtp(userId, req));

        assertTrue(ex.getMessage().contains("expired"));
    }

    @Test
    @DisplayName("verifyOtp: Rejects when invalid OTP is provided and increments attempt count")
    void verifyOtp_RejectsInvalidOtp_TracksAttempts() {
        AlternativeEmailVerification existing = new AlternativeEmailVerification(userId, altEmail, altEmailNorm);
        existing.setOtpHash("encoded-123456");
        existing.setOtpExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));
        existing.setOtpAttempts(1);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(verificationRepository.findByUserIdAndEmailNormalized(userId, altEmailNorm)).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("999999", "encoded-123456")).thenReturn(false);

        VerifyAltEmailOtpRequest req = new VerifyAltEmailOtpRequest(altEmail, "999999", false);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                findService.verifyOtp(userId, req));

        assertTrue(ex.getMessage().contains("Invalid verification code"));
        assertEquals(2, existing.getOtpAttempts());
        verify(verificationRepository, times(1)).save(existing);
    }

    @Test
    @DisplayName("verifyOtp: Rejects when max attempts (5) are reached")
    void verifyOtp_RejectsMaxAttempts() {
        AlternativeEmailVerification existing = new AlternativeEmailVerification(userId, altEmail, altEmailNorm);
        existing.setOtpHash("encoded-123456");
        existing.setOtpExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));
        existing.setOtpAttempts(5); // already 5

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(verificationRepository.findByUserIdAndEmailNormalized(userId, altEmailNorm)).thenReturn(Optional.of(existing));

        VerifyAltEmailOtpRequest req = new VerifyAltEmailOtpRequest(altEmail, "123456", false);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                findService.verifyOtp(userId, req));

        assertTrue(ex.getMessage().contains("Maximum verification attempts"));
    }

    @Test
    @DisplayName("getFoundPurchases: Correctly categorizes Available to Link, Already Linked, and Linked to Another Account")
    void getFoundPurchases_CategorizesStatusesCorrectly() {
        // Mark alt email as saved secondary on user
        testUser.addSecondaryEmail(altEmail, altEmailNorm);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // Create 3 test purchases for this alt email:
        // 1. Available to Link (unlinked)
        Purchase p1 = new Purchase();
        p1.setId("p-unlinked");
        p1.setPurchaseReference("REF-UNLINKED");
        p1.setCustomerEmail(altEmail);
        p1.setCustomerEmailNormalized(altEmailNorm);
        p1.setCustomerId(null);
        p1.setLinkingStatus(LinkingStatus.UNCLAIMED);
        p1.setPurchaseDate(LocalDate.now().minusDays(5));

        // 2. Already Linked to this customer
        Purchase p2 = new Purchase();
        p2.setId("p-self-linked");
        p2.setPurchaseReference("REF-SELF");
        p2.setCustomerEmail(altEmail);
        p2.setCustomerEmailNormalized(altEmailNorm);
        p2.setCustomerId(userId);
        p2.setLinkingStatus(LinkingStatus.LINKED);
        p2.setPurchaseDate(LocalDate.now().minusDays(10));

        // 3. Linked to another customer account
        Purchase p3 = new Purchase();
        p3.setId("p-other-linked");
        p3.setPurchaseReference("REF-OTHER");
        p3.setCustomerEmail(altEmail);
        p3.setCustomerEmailNormalized(altEmailNorm);
        p3.setCustomerId("other-user-999");
        p3.setLinkingStatus(LinkingStatus.LINKED);
        p3.setSerialNumber("SN12345678");
        p3.setPurchaseDate(LocalDate.now().minusDays(20));

        when(purchaseRepository.findByCustomerEmailNormalized(altEmailNorm))
                .thenReturn(List.of(p1, p2, p3));

        FindPurchasesResultResponse result = findService.getFoundPurchases(userId, altEmail, null);

        assertNotNull(result);
        assertEquals(3, result.getTotalCount());
        assertEquals(1, result.getAvailableCount());
        assertEquals(1, result.getAlreadyLinkedCount());
        assertEquals(1, result.getLinkedToOtherCount());
        assertTrue(result.isSavedSecondary());

        // Verify status mapping of p1 (Available)
        AltPurchaseItemResponse item1 = result.getPurchases().stream()
                .filter(p -> "p-unlinked".equals(p.getId())).findFirst().orElseThrow();
        assertEquals("AVAILABLE_TO_LINK", item1.getLinkingStatus());
        assertEquals("Available to Link", item1.getStatusLabel());
        assertTrue(item1.isCanLink());

        // Verify status mapping of p2 (Already Linked)
        AltPurchaseItemResponse item2 = result.getPurchases().stream()
                .filter(p -> "p-self-linked".equals(p.getId())).findFirst().orElseThrow();
        assertEquals("ALREADY_LINKED", item2.getLinkingStatus());
        assertEquals("Already Linked", item2.getStatusLabel());
        assertFalse(item2.isCanLink());

        // Verify status mapping of p3 (Linked to Other) with privacy masking
        AltPurchaseItemResponse item3 = result.getPurchases().stream()
                .filter(p -> "p-other-linked".equals(p.getId())).findFirst().orElseThrow();
        assertEquals("LINKED_TO_OTHER", item3.getLinkingStatus());
        assertEquals("Linked to Another Account", item3.getStatusLabel());
        assertFalse(item3.isCanLink());
        assertTrue(item3.getSerialNumber().startsWith("••••••••"));
    }

    @Test
    @DisplayName("getFoundPurchases: Rejects lookup when email ownership has not been verified")
    void getFoundPurchases_RejectsUnverifiedEmail() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(verificationRepository.findByUserIdAndEmailNormalized(userId, altEmailNorm)).thenReturn(Optional.empty());

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                findService.getFoundPurchases(userId, altEmail, null));

        assertTrue(ex.getMessage().contains("not been verified"));
    }

    @Test
    @DisplayName("linkPurchase: Successfully links purchase and warranty while preserving retailer records")
    void linkPurchase_Success_PreservesRetailerRecords() {
        testUser.addSecondaryEmail(altEmail, altEmailNorm);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        Purchase purchase = new Purchase();
        purchase.setId("pur-1");
        purchase.setRetailerId("ret-99");
        purchase.setBillId("bill-100");
        purchase.setInvoiceNumber("INV-2026-001");
        purchase.setPurchaseReference("PUR-REF-1");
        purchase.setCustomerEmail(altEmail);
        purchase.setCustomerEmailNormalized(altEmailNorm);
        purchase.setCustomerId(null);
        purchase.setLinkingStatus(LinkingStatus.UNCLAIMED);

        Warranty warranty = new Warranty();
        warranty.setId("war-1");
        warranty.setPurchaseId("pur-1");
        warranty.setCustomerId(null);

        when(purchaseRepository.findById("pur-1")).thenReturn(Optional.of(purchase));
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(i -> i.getArgument(0));
        when(warrantyRepository.findByPurchaseId("pur-1")).thenReturn(Optional.of(warranty));
        when(warrantyRepository.save(any(Warranty.class))).thenAnswer(i -> i.getArgument(0));
        when(purchaseService.mapToResponse(any(Purchase.class))).thenReturn(new PurchaseResponse());

        LinkAltEmailPurchaseRequest req = new LinkAltEmailPurchaseRequest("pur-1", altEmail, null);
        PurchaseResponse response = findService.linkPurchase(userId, req);

        assertNotNull(response);

        // Verify purchase updated to current user
        assertEquals(userId, purchase.getCustomerId());
        assertEquals(LinkingStatus.LINKED, purchase.getLinkingStatus());

        // Verify original retailer fields remain intact!
        assertEquals("ret-99", purchase.getRetailerId());
        assertEquals("bill-100", purchase.getBillId());
        assertEquals("INV-2026-001", purchase.getInvoiceNumber());
        assertEquals(altEmail, purchase.getCustomerEmail());
        assertEquals(altEmailNorm, purchase.getCustomerEmailNormalized());

        // Verify warranty linked
        assertEquals(userId, warranty.getCustomerId());

        verify(notificationService, times(1)).sendNotification(eq(userId), any(), anyString(), eq("war-1"), eq("Warranty"));
        verify(auditService, times(1)).logAction(eq(userId), anyString(), eq("PURCHASE_LINKED_ALT_EMAIL"), anyString(), eq("pur-1"), anyString());
    }

    @Test
    @DisplayName("linkPurchase: Prevents unauthorized claim of purchase belonging to another account")
    void linkPurchase_PreventsUnauthorizedClaimOfOtherAccount() {
        testUser.addSecondaryEmail(altEmail, altEmailNorm);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        Purchase purchase = new Purchase();
        purchase.setId("pur-claimed");
        purchase.setCustomerEmail(altEmail);
        purchase.setCustomerEmailNormalized(altEmailNorm);
        purchase.setCustomerId("victim-user-888"); // Already claimed by another user
        purchase.setLinkingStatus(LinkingStatus.LINKED);

        when(purchaseRepository.findById("pur-claimed")).thenReturn(Optional.of(purchase));

        LinkAltEmailPurchaseRequest req = new LinkAltEmailPurchaseRequest("pur-claimed", altEmail, null);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                findService.linkPurchase(userId, req));

        assertTrue(ex.getMessage().contains("already been claimed by another customer account"));
        // Ensure purchase was never changed or saved
        assertEquals("victim-user-888", purchase.getCustomerId());
        verify(purchaseRepository, never()).save(purchase);
    }

    @Test
    @DisplayName("secondaryEmails: Add, get stats, and remove")
    void secondaryEmails_CrudAndStats() {
        testUser.addSecondaryEmail(altEmail, altEmailNorm);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        Purchase p1 = new Purchase();
        p1.setCustomerId(userId);
        p1.setLinkingStatus(LinkingStatus.LINKED);
        when(purchaseRepository.findByCustomerEmailNormalized(altEmailNorm)).thenReturn(List.of(p1));

        List<SecondaryEmailDto> list = findService.getSecondaryEmails(userId);
        assertEquals(1, list.size());
        assertEquals(altEmail, list.get(0).getEmail());
        assertEquals(1, list.get(0).getLinkedPurchasesCount());
        assertEquals(0, list.get(0).getAvailablePurchasesCount());

        // Remove
        findService.removeSecondaryEmail(userId, altEmail);
        assertFalse(testUser.hasSecondaryEmail(altEmailNorm));
        verify(userRepository, times(1)).save(testUser);
        verify(verificationRepository, times(1)).deleteByUserIdAndEmailNormalized(userId, altEmailNorm);
    }
}
