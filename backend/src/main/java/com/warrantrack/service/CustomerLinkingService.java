package com.warrantrack.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.warrantrack.dto.purchase.LinkPurchaseRequest;
import com.warrantrack.dto.purchase.PurchaseResponse;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.exception.UnauthorizedException;
import com.warrantrack.model.Purchase;
import com.warrantrack.model.User;
import com.warrantrack.model.Warranty;
import com.warrantrack.model.enums.AccountStatus;
import com.warrantrack.model.enums.LinkingStatus;
import com.warrantrack.model.enums.NotificationType;
import com.warrantrack.repository.PurchaseRepository;
import com.warrantrack.repository.UserRepository;
import com.warrantrack.repository.WarrantyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class CustomerLinkingService {
    private static final Logger log = LoggerFactory.getLogger(CustomerLinkingService.class);

    private final PurchaseRepository purchaseRepository;
    private final WarrantyRepository warrantyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final PurchaseService purchaseService;

    public CustomerLinkingService(PurchaseRepository purchaseRepository,
                                  WarrantyRepository warrantyRepository,
                                  UserRepository userRepository,
                                  NotificationService notificationService,
                                  AuditService auditService,
                                  PurchaseService purchaseService) {
        this.purchaseRepository = purchaseRepository;
        this.warrantyRepository = warrantyRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.purchaseService = purchaseService;
    }

    /**
     * Automatically links all purchases registered to a verified customer's email.
     * Prevents unauthorized claiming by validating verified email ownership and checking for prior assignment.
     */
    @Transactional
    public int autoLinkPurchasesForUser(User user) {
        if (user == null || !user.isEmailVerified() || user.getAccountStatus() != AccountStatus.ACTIVE) {
            return 0;
        }

        String normalizedEmail = user.getEmailNormalized();
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            return 0;
        }

        List<Purchase> matchingPurchases = purchaseRepository.findByCustomerEmailNormalized(normalizedEmail);
        int linkedCount = 0;

        for (Purchase purchase : matchingPurchases) {
            // Secure ownership validation:
            // 1. Normalized customer email must match authenticated user's verified email
            if (!normalizedEmail.equalsIgnoreCase(purchase.getCustomerEmailNormalized())) {
                continue;
            }

            // 2. Prevent claiming if already owned by another customer account
            if (purchase.getCustomerId() != null && !purchase.getCustomerId().equals(user.getId())) {
                continue;
            }

            // If already fully linked to this user, skip
            if (LinkingStatus.LINKED.equals(purchase.getLinkingStatus()) && user.getId().equals(purchase.getCustomerId())) {
                continue;
            }

            // Link purchase to customer
            purchase.setCustomerId(user.getId());
            purchase.setLinkingStatus(LinkingStatus.LINKED);
            purchase.setUpdatedAt(Instant.now());
            purchaseRepository.save(purchase);

            // Link matching warranty certificate if present
            Warranty warranty = warrantyRepository.findByPurchaseId(purchase.getId()).orElse(null);
            if (warranty != null) {
                warranty.setCustomerId(user.getId());
                warranty.setUpdatedAt(Instant.now());
                warrantyRepository.save(warranty);

                notificationService.sendNotification(
                        user.getId(),
                        NotificationType.PURCHASE_LINKED,
                        String.format("Purchase '%s' (%s) and digital warranty certificate have been automatically linked to your account.",
                                purchase.getPurchaseReference(),
                                purchase.getProductName() != null ? purchase.getProductName() : "Product"),
                        warranty.getId(),
                        "Warranty"
                );
            } else {
                notificationService.sendNotification(
                        user.getId(),
                        NotificationType.PURCHASE_LINKED,
                        String.format("Purchase '%s' (%s) has been automatically linked to your account.",
                                purchase.getPurchaseReference(),
                                purchase.getProductName() != null ? purchase.getProductName() : "Product"),
                        purchase.getId(),
                        "Purchase"
                );
            }

            auditService.logAction(user.getId(), user.getEmail(), "PURCHASE_AUTO_LINKED", "Purchase", purchase.getId(),
                    "Automatically linked purchase to verified customer account: " + purchase.getPurchaseReference());

            linkedCount++;
        }

        if (linkedCount > 0) {
            log.info("Automatically linked {} purchases for verified customer: {}", linkedCount, user.getEmail());
        }

        return linkedCount;
    }

    /**
     * Convenience method to auto-link all purchases for a user by user ID.
     */
    @Transactional
    public int autoLinkPendingPurchases(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return autoLinkPurchasesForUser(user);
    }

    /**
     * Retrieves pending/unclaimed purchases for a customer.
     * Automatically attempts to link any unlinked purchases first if the user is email-verified.
     */
    public List<PurchaseResponse> getPendingPurchases(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // If email is verified, automatically sync and link all matching purchases
        if (user.isEmailVerified() && user.getAccountStatus() == AccountStatus.ACTIVE) {
            autoLinkPurchasesForUser(user);
        }

        String normalizedEmail = user.getEmailNormalized();

        List<Purchase> purchases = purchaseRepository.findByCustomerEmailNormalized(normalizedEmail).stream()
                .filter(p -> p.getLinkingStatus() != LinkingStatus.LINKED || p.getCustomerId() == null)
                .toList();

        return purchases.stream()
                .map(purchaseService::mapToResponse)
                .toList();
    }

    /**
     * Direct 1-click claim: Links a purchase to the customer's account without requiring redundant OTP,
     * relying on authenticated session and verified account email ownership.
     */
    @Transactional
    public PurchaseResponse claimPurchase(String userId, String purchaseId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Security check 1: User must have verified their email during registration
        if (!user.isEmailVerified()) {
            throw new BadRequestException("Please verify your account email address before claiming purchases.");
        }

        // Security check 2: User account must be active
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Your customer account is currently not active.");
        }

        Purchase purchase = purchaseRepository.findById(purchaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase", "id", purchaseId));

        // Security check 3: Purchase email must match the authenticated user's email
        if (!user.getEmailNormalized().equalsIgnoreCase(purchase.getCustomerEmailNormalized())) {
            throw new UnauthorizedException("Purchase email does not match your verified account email address.");
        }

        // Security check 4: Prevent claiming if already owned by another customer
        if (purchase.getLinkingStatus() == LinkingStatus.LINKED && purchase.getCustomerId() != null
                && !purchase.getCustomerId().equals(user.getId())) {
            throw new BadRequestException("This purchase has already been claimed by another customer account.");
        }

        // Link purchase
        purchase.setCustomerId(user.getId());
        purchase.setLinkingStatus(LinkingStatus.LINKED);
        purchase.setUpdatedAt(Instant.now());
        purchase = purchaseRepository.save(purchase);

        // Link warranty
        Warranty warranty = warrantyRepository.findByPurchaseId(purchase.getId()).orElse(null);
        if (warranty != null) {
            warranty.setCustomerId(user.getId());
            warranty.setUpdatedAt(Instant.now());
            warrantyRepository.save(warranty);

            notificationService.sendNotification(
                    user.getId(),
                    NotificationType.PURCHASE_LINKED,
                    String.format("Purchase '%s' (%s) and digital warranty certificate have been successfully linked to your account.",
                            purchase.getPurchaseReference(),
                            purchase.getProductName() != null ? purchase.getProductName() : "Product"),
                    warranty.getId(),
                    "Warranty"
            );
        }

        auditService.logAction(user.getId(), user.getEmail(), "PURCHASE_LINKED", "Purchase", purchase.getId(),
                "Customer successfully linked purchase: " + purchase.getPurchaseReference());

        return purchaseService.mapToResponse(purchase);
    }

    /**
     * Backwards compatible linking method: no longer requires OTP.
     */
    @Transactional
    public PurchaseResponse verifyAndLinkPurchase(String userId, String purchaseId, LinkPurchaseRequest request) {
        return claimPurchase(userId, purchaseId);
    }
}
