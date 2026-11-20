package com.warrantrack.service;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.claim.*;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.exception.InvalidStateTransitionException;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.exception.UnauthorizedException;
import com.warrantrack.model.*;
import com.warrantrack.model.enums.ClaimStatus;
import com.warrantrack.model.enums.NotificationType;
import com.warrantrack.model.enums.ResolutionType;
import com.warrantrack.repository.*;
import com.warrantrack.util.DateCalculator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ClaimService {
    private static final Logger log = LoggerFactory.getLogger(ClaimService.class);


    private final ClaimRepository claimRepository;
    private final ClaimStatusHistoryRepository historyRepository;
    private final WarrantyRepository warrantyRepository;
    private final PurchaseRepository purchaseRepository;
    private final ProductRepository productRepository;
    private final RetailerRepository retailerRepository;
    private final UserRepository userRepository;
    private final RetailerService retailerService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public ClaimService(ClaimRepository claimRepository, ClaimStatusHistoryRepository historyRepository, WarrantyRepository warrantyRepository, PurchaseRepository purchaseRepository, ProductRepository productRepository, RetailerRepository retailerRepository, UserRepository userRepository, RetailerService retailerService, NotificationService notificationService, AuditService auditService) {
        this.claimRepository = claimRepository;
        this.historyRepository = historyRepository;
        this.warrantyRepository = warrantyRepository;
        this.purchaseRepository = purchaseRepository;
        this.productRepository = productRepository;
        this.retailerRepository = retailerRepository;
        this.userRepository = userRepository;
        this.retailerService = retailerService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public ClaimResponse submitClaim(String customerId, ClaimSubmissionRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", customerId));

        Warranty warranty = warrantyRepository.findById(request.getWarrantyId())
                .orElseThrow(() -> new ResourceNotFoundException("Warranty", "id", request.getWarrantyId()));

        // 1. Verify warranty ownership: only the customer who owns this warranty can file a claim
        if (!customerId.equals(warranty.getCustomerId())) {
            throw new UnauthorizedException("You can only submit claims for warranties linked to your account.");
        }

        // 2. Validate warranty coverage dates: today must be within [startDate, expiryDate] (inclusive)
        LocalDate today = LocalDate.now();
        if (today.isBefore(warranty.getStartDate())) {
            throw new BadRequestException("Warranty coverage has not started yet. Coverage begins on " + warranty.getStartDate());
        }
        if (today.isAfter(warranty.getExpiryDate())) {
            throw new BadRequestException("Warranty has expired on " + warranty.getExpiryDate() +
                    ". New claims cannot be submitted after the expiry date.");
        }

        // 2b. Prevent duplicate active claims: ensure no other claim is currently in progress
        List<ClaimStatus> activeStatuses = List.of(
                ClaimStatus.SUBMITTED,
                ClaimStatus.UNDER_REVIEW,
                ClaimStatus.ADDITIONAL_INFO_REQUIRED,
                ClaimStatus.APPROVED,
                ClaimStatus.IN_PROGRESS
        );
        if (claimRepository.existsByWarrantyIdAndCurrentStatusIn(warranty.getId(), activeStatuses)) {
            throw new BadRequestException("An active claim is already in progress for this warranty. Please wait until it is resolved or cancelled before submitting another claim.");
        }

        // 3. Initialize Claim with status SUBMITTED
        Claim claim = Claim.builder()
                .warrantyId(warranty.getId())
                .purchaseId(warranty.getPurchaseId())
                .retailerId(warranty.getRetailerId())
                .customerId(customerId)
                .issueDescription(request.getIssueDescription().trim())
                .evidenceReferences(request.getEvidenceReferences() != null ? request.getEvidenceReferences() : new ArrayList<>())
                .currentStatus(ClaimStatus.SUBMITTED)
                .serviceNotes(new ArrayList<>())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        claim = claimRepository.save(claim);

        // Record initial history
        recordHistory(claim.getId(), null, ClaimStatus.SUBMITTED, customer.getEmail(), "Claim submitted by customer");

        // Notify retailer
        Retailer retailer = retailerRepository.findById(warranty.getRetailerId()).orElse(null);
        if (retailer != null) {
            notificationService.sendNotification(
                    retailer.getUserId(),
                    NotificationType.CLAIM_SUBMITTED,
                    "New warranty claim submitted for product: " + warranty.getProductName(),
                    claim.getId(),
                    "Claim"
            );
        }

        auditService.logAction(customerId, customer.getEmail(), "CLAIM_SUBMITTED", "Claim", claim.getId(),
                "Issue: " + claim.getIssueDescription());

        return mapToResponse(claim);
    }

    public PagedResponse<ClaimResponse> getCustomerClaims(String customerId, Pageable pageable) {
        Page<Claim> page = claimRepository.findByCustomerId(customerId, pageable);
        List<ClaimResponse> list = page.getContent().stream().map(this::mapToResponse).toList();

        return PagedResponse.<ClaimResponse>builder()
                .content(list)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public PagedResponse<ClaimResponse> getRetailerClaims(String userId, ClaimStatus status, Pageable pageable) {
        Retailer retailer = retailerService.getRetailerByUserId(userId);
        Page<Claim> page = claimRepository.findByRetailerId(retailer.getId(), pageable);

        List<ClaimResponse> list = page.getContent().stream()
                .filter(c -> status == null || c.getCurrentStatus() == status)
                .map(this::mapToResponse)
                .toList();

        return PagedResponse.<ClaimResponse>builder()
                .content(list)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public PagedResponse<ClaimResponse> getAllClaimsForAdmin(ClaimStatus status, Pageable pageable) {
        Page<Claim> page = (status != null)
                ? claimRepository.findByCurrentStatus(status, pageable)
                : claimRepository.findAll(pageable);

        List<ClaimResponse> list = page.getContent().stream().map(this::mapToResponse).toList();

        return PagedResponse.<ClaimResponse>builder()
                .content(list)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public ClaimResponse getClaimById(String actorUserId, String claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim", "id", claimId));

        User user = userRepository.findById(actorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", actorUserId));

        // Authorization check
        if (user.getRole() == com.warrantrack.model.enums.Role.CUSTOMER) {
            if (!claim.getCustomerId().equals(actorUserId)) {
                throw new UnauthorizedException("Cannot view claims of another customer.");
            }
        } else if (user.getRole() == com.warrantrack.model.enums.Role.RETAILER) {
            Retailer retailer = retailerService.getRetailerByUserId(actorUserId);
            if (!claim.getRetailerId().equals(retailer.getId())) {
                throw new UnauthorizedException("Cannot view claims belonging to another retailer.");
            }
        }

        return mapToResponse(claim);
    }

    @Transactional
    public ClaimResponse startReview(String userId, String claimId) {
        Retailer retailer = retailerService.getApprovedRetailerByUserId(userId);
        Claim claim = getClaimAndValidateRetailer(claimId, retailer.getId());

        validateTransition(claim.getCurrentStatus(), ClaimStatus.UNDER_REVIEW);

        ClaimStatus prev = claim.getCurrentStatus();
        claim.setCurrentStatus(ClaimStatus.UNDER_REVIEW);
        claim.setUpdatedAt(Instant.now());
        claim = claimRepository.save(claim);

        recordHistory(claim.getId(), prev, ClaimStatus.UNDER_REVIEW, retailer.getContactEmail(), "Retailer began claim review");

        notifyCustomer(claim, "Your warranty claim is now under review by " + retailer.getBusinessName());
        return mapToResponse(claim);
    }

    @Transactional
    public ClaimResponse cancelClaim(String customerId, String claimId, ClaimCancelRequest request) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim", "id", claimId));

        if (!claim.getCustomerId().equals(customerId)) {
            throw new UnauthorizedException("Cannot cancel claim belonging to another user.");
        }

        // State guard: Customer may only cancel a claim while it is in SUBMITTED or UNDER_REVIEW status
        if (claim.getCurrentStatus() != ClaimStatus.SUBMITTED && claim.getCurrentStatus() != ClaimStatus.UNDER_REVIEW) {
            throw new BadRequestException("Claims can only be cancelled while in SUBMITTED or UNDER_REVIEW status.");
        }

        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new BadRequestException("A cancellation reason is required.");
        }

        ClaimStatus prev = claim.getCurrentStatus();
        claim.setCurrentStatus(ClaimStatus.CANCELLED);
        claim.setCancellationReason(request.getReason().trim());
        claim.setCancelledBy(customerId);
        claim.setCancelledAt(Instant.now());
        claim.setUpdatedAt(Instant.now());
        claim = claimRepository.save(claim);

        recordHistory(claim.getId(), prev, ClaimStatus.CANCELLED, "Customer", "Cancelled by customer: " + request.getReason());

        auditService.logAction(customerId, "CUSTOMER", "CLAIM_CANCELLED", "Claim", claim.getId(),
                "Claim cancelled by customer: " + request.getReason().trim());

        return mapToResponse(claim);
    }

    @Transactional
    public ClaimResponse makeDecision(String userId, String claimId, ClaimDecisionRequest request) {
        Retailer retailer = retailerService.getApprovedRetailerByUserId(userId);
        Claim claim = getClaimAndValidateRetailer(claimId, retailer.getId());

        if (claim.getCurrentStatus() != ClaimStatus.UNDER_REVIEW) {
            throw new BadRequestException("Claims can only be approved or rejected while in UNDER_REVIEW status.");
        }

        ClaimStatus prev = claim.getCurrentStatus();
        ClaimStatus nextStatus = Boolean.TRUE.equals(request.getApproved()) ? ClaimStatus.APPROVED : ClaimStatus.REJECTED;

        validateTransition(prev, nextStatus);

        if (nextStatus == ClaimStatus.REJECTED) {
            if (request.getReason() == null || request.getReason().isBlank()) {
                throw new BadRequestException("A reason is mandatory when rejecting a claim.");
            }
            claim.setDecisionReason(request.getReason().trim());
        } else {
            // Approved
            if (request.getResolutionType() == null) {
                claim.setResolutionType(ResolutionType.REPAIR); // Default to repair
            } else {
                claim.setResolutionType(request.getResolutionType());
            }
            claim.setDecisionReason(request.getReason() != null ? request.getReason().trim() : "Claim approved");
        }

        claim.setCurrentStatus(nextStatus);
        claim.setDecisionBy(retailer.getContactEmail());
        claim.setDecisionAt(Instant.now());
        claim.setUpdatedAt(Instant.now());
        claim = claimRepository.save(claim);

        String note = (nextStatus == ClaimStatus.APPROVED)
                ? "Claim approved. Resolution type: " + claim.getResolutionType()
                : "Claim rejected. Reason: " + claim.getDecisionReason();

        recordHistory(claim.getId(), prev, nextStatus, retailer.getContactEmail(), note);

        auditService.logAction(userId, retailer.getContactEmail(), "CLAIM_DECIDED_" + nextStatus, "Claim", claim.getId(),
                note);

        notifyCustomer(claim, (nextStatus == ClaimStatus.APPROVED)
                ? "Great news! Your claim has been approved for " + claim.getResolutionType()
                : "Your warranty claim was rejected: " + claim.getDecisionReason());

        return mapToResponse(claim);
    }

    @Transactional
    public ClaimResponse requestAdditionalInfo(String userId, String claimId, AdditionalInfoPromptRequest request) {
        Retailer retailer = retailerService.getApprovedRetailerByUserId(userId);
        Claim claim = getClaimAndValidateRetailer(claimId, retailer.getId());

        if (claim.getCurrentStatus() != ClaimStatus.UNDER_REVIEW) {
            throw new BadRequestException("Additional information can only be requested when claim is UNDER_REVIEW.");
        }

        validateTransition(claim.getCurrentStatus(), ClaimStatus.ADDITIONAL_INFO_REQUIRED);

        ClaimStatus prev = claim.getCurrentStatus();
        claim.setCurrentStatus(ClaimStatus.ADDITIONAL_INFO_REQUIRED);
        claim.setUpdatedAt(Instant.now());
        claim = claimRepository.save(claim);

        recordHistory(claim.getId(), prev, ClaimStatus.ADDITIONAL_INFO_REQUIRED, retailer.getContactEmail(),
                "Info requested: " + request.getReason().trim());

        auditService.logAction(userId, retailer.getContactEmail(), "CLAIM_INFO_REQUESTED", "Claim", claim.getId(),
                "Retailer requested additional info: " + request.getReason().trim());

        notifyCustomer(claim, "Action needed: Retailer requested additional information for your claim: " + request.getReason().trim());

        return mapToResponse(claim);
    }

    @Transactional
    public ClaimResponse replyAdditionalInfo(String customerId, String claimId, AdditionalInfoReplyRequest request) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim", "id", claimId));

        if (!claim.getCustomerId().equals(customerId)) {
            throw new UnauthorizedException("Cannot reply to info request on another user's claim.");
        }

        if (claim.getCurrentStatus() != ClaimStatus.ADDITIONAL_INFO_REQUIRED) {
            throw new BadRequestException("Claim is not awaiting additional information.");
        }

        validateTransition(claim.getCurrentStatus(), ClaimStatus.UNDER_REVIEW);

        ClaimStatus prev = claim.getCurrentStatus();
        claim.setCurrentStatus(ClaimStatus.UNDER_REVIEW);
        if (request.getAdditionalEvidence() != null && !request.getAdditionalEvidence().isEmpty()) {
            if (claim.getEvidenceReferences() == null) {
                claim.setEvidenceReferences(new ArrayList<>());
            }
            claim.getEvidenceReferences().addAll(request.getAdditionalEvidence());
        }
        claim.setUpdatedAt(Instant.now());
        claim = claimRepository.save(claim);

        String responseText;
        if (request.getResponse() != null && !request.getResponse().trim().isEmpty()) {
            responseText = request.getResponse().trim();
        } else if (request.getAdditionalEvidence() != null && !request.getAdditionalEvidence().isEmpty()) {
            responseText = "Customer uploaded supporting image(s)/evidence";
        } else {
            responseText = "Customer confirmed and provided information";
        }

        recordHistory(claim.getId(), prev, ClaimStatus.UNDER_REVIEW, "Customer",
                "Customer provided response: " + responseText);

        auditService.logAction(customerId, "CUSTOMER", "CLAIM_INFO_REPLIED", "Claim", claim.getId(),
                "Customer responded to additional info request: " + responseText);

        // Notify retailer
        Retailer retailer = retailerRepository.findById(claim.getRetailerId()).orElse(null);
        if (retailer != null) {
            notificationService.sendNotification(
                    retailer.getUserId(),
                    NotificationType.ADDITIONAL_INFO_PROVIDED,
                    "Customer provided requested info on claim. Status returned to UNDER_REVIEW.",
                    claim.getId(),
                    "Claim"
            );
        }

        return mapToResponse(claim);
    }

    @Transactional
    public ClaimResponse updateServiceProgress(String userId, String claimId, ServiceProgressRequest request) {
        Retailer retailer = retailerService.getApprovedRetailerByUserId(userId);
        Claim claim = getClaimAndValidateRetailer(claimId, retailer.getId());

        ClaimStatus prev = claim.getCurrentStatus();
        if (claim.getCurrentStatus() == ClaimStatus.APPROVED) {
            validateTransition(prev, ClaimStatus.IN_PROGRESS);
            claim.setCurrentStatus(ClaimStatus.IN_PROGRESS);
            recordHistory(claim.getId(), prev, ClaimStatus.IN_PROGRESS, retailer.getContactEmail(), "Service started: " + request.getNote());
        }

        if (claim.getServiceNotes() == null) {
            claim.setServiceNotes(new ArrayList<>());
        }
        claim.getServiceNotes().add(new Claim.ServiceNote(request.getNote().trim(), retailer.getContactEmail(), Instant.now()));
        claim.setUpdatedAt(Instant.now());
        claim = claimRepository.save(claim);

        notifyCustomer(claim, "Service update on your claim: " + request.getNote());

        auditService.logAction(userId, retailer.getContactEmail(), "CLAIM_PROGRESS_UPDATED", "Claim", claim.getId(),
                "Service progress updated: " + request.getNote().trim());

        return mapToResponse(claim);
    }

    @Transactional
    public ClaimResponse completeClaim(String userId, String claimId, CompleteClaimRequest request) {
        Retailer retailer = retailerService.getApprovedRetailerByUserId(userId);
        Claim claim = getClaimAndValidateRetailer(claimId, retailer.getId());

        if (claim.getCurrentStatus() != ClaimStatus.IN_PROGRESS && claim.getCurrentStatus() != ClaimStatus.APPROVED) {
            throw new BadRequestException("Only claims in APPROVED or IN_PROGRESS state can be completed.");
        }

        ClaimStatus prev = claim.getCurrentStatus();
        validateTransition(prev, ClaimStatus.COMPLETED);

        claim.setCurrentStatus(ClaimStatus.COMPLETED);
        claim.setResolutionNotes(request.getResolutionNotes().trim());
        claim.setUpdatedAt(Instant.now());
        claim = claimRepository.save(claim);

        recordHistory(claim.getId(), prev, ClaimStatus.COMPLETED, retailer.getContactEmail(),
                "Claim completed. Resolution: " + request.getResolutionNotes());

        auditService.logAction(userId, retailer.getContactEmail(), "CLAIM_COMPLETED", "Claim", claim.getId(),
                "Claim completed. Resolution: " + request.getResolutionNotes().trim());

        notifyCustomer(claim, "Your warranty service has been completed! Resolution: " + request.getResolutionNotes());

        return mapToResponse(claim);
    }

    private void validateTransition(ClaimStatus from, ClaimStatus to) {
        boolean valid = switch (from) {
            case SUBMITTED -> (to == ClaimStatus.UNDER_REVIEW || to == ClaimStatus.CANCELLED);
            case UNDER_REVIEW -> (to == ClaimStatus.APPROVED || to == ClaimStatus.REJECTED
                    || to == ClaimStatus.ADDITIONAL_INFO_REQUIRED || to == ClaimStatus.CANCELLED);
            case ADDITIONAL_INFO_REQUIRED -> (to == ClaimStatus.UNDER_REVIEW);
            case APPROVED -> (to == ClaimStatus.IN_PROGRESS || to == ClaimStatus.COMPLETED);
            case IN_PROGRESS -> (to == ClaimStatus.COMPLETED);
            default -> false;
        };

        if (!valid) {
            throw new InvalidStateTransitionException(from.name(), to.name());
        }
    }

    private Claim getClaimAndValidateRetailer(String claimId, String retailerId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim", "id", claimId));
        if (!claim.getRetailerId().equals(retailerId)) {
            throw new UnauthorizedException("Cannot modify claim belonging to another retailer.");
        }
        return claim;
    }

    private void recordHistory(String claimId, ClaimStatus prev, ClaimStatus next, String changedBy, String note) {
        ClaimStatusHistory history = ClaimStatusHistory.builder()
                .claimId(claimId)
                .previousStatus(prev)
                .newStatus(next)
                .changedBy(changedBy)
                .changedAt(Instant.now())
                .note(note)
                .build();
        historyRepository.save(history);
    }

    private void notifyCustomer(Claim claim, String message) {
        notificationService.sendNotification(
                claim.getCustomerId(),
                NotificationType.CLAIM_STATUS_CHANGED,
                message,
                claim.getId(),
                "Claim"
        );
    }

    public ClaimResponse mapToResponse(Claim c) {
        Warranty warranty = warrantyRepository.findById(c.getWarrantyId()).orElse(null);
        Purchase purchase = c.getPurchaseId() != null ? purchaseRepository.findById(c.getPurchaseId()).orElse(null) : null;
        String serialNumber = (warranty != null && warranty.getSerialNumber() != null && !warranty.getSerialNumber().isBlank())
                ? warranty.getSerialNumber()
                : (purchase != null ? purchase.getSerialNumber() : null);
        Retailer retailer = retailerRepository.findById(c.getRetailerId()).orElse(null);
        User customer = userRepository.findById(c.getCustomerId()).orElse(null);

        List<ClaimStatusHistoryResponse> historyResponses = historyRepository.findByClaimIdOrderByChangedAtAsc(c.getId())
                .stream()
                .map(h -> ClaimStatusHistoryResponse.builder()
                        .id(h.getId())
                        .claimId(h.getClaimId())
                        .previousStatus(h.getPreviousStatus())
                        .newStatus(h.getNewStatus())
                        .changedBy(h.getChangedBy())
                        .changedAt(h.getChangedAt())
                        .note(h.getNote())
                        .build())
                .toList();

        return ClaimResponse.builder()
                .id(c.getId())
                .warrantyId(c.getWarrantyId())
                .purchaseId(c.getPurchaseId())
                .retailerId(c.getRetailerId())
                .retailerBusinessName(retailer != null ? retailer.getBusinessName() : "Retailer")
                .customerId(c.getCustomerId())
                .customerName(customer != null ? customer.getName() : "Customer")
                .customerEmail(customer != null ? customer.getEmail() : "")
                .productName(warranty != null ? warranty.getProductName() : "Product")
                .serialNumber(serialNumber)
                .issueDescription(c.getIssueDescription())
                .evidenceReferences(c.getEvidenceReferences())
                .currentStatus(c.getCurrentStatus())
                .decisionReason(c.getDecisionReason())
                .decisionBy(c.getDecisionBy())
                .decisionAt(c.getDecisionAt())
                .resolutionType(c.getResolutionType())
                .resolutionNotes(c.getResolutionNotes())
                .cancellationReason(c.getCancellationReason())
                .customerRating(c.getCustomerRating())
                .customerFeedback(c.getCustomerFeedback())
                .feedbackSubmittedAt(c.getFeedbackSubmittedAt())
                .serviceNotes(c.getServiceNotes())
                .statusHistory(historyResponses)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    @Transactional
    public ClaimResponse submitFeedback(String customerId, String claimId, ClaimFeedbackRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", customerId));

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim", "id", claimId));

        if (!customerId.equals(claim.getCustomerId())) {
            throw new UnauthorizedException("You can only submit feedback for claims filed by your account.");
        }

        if (claim.getCurrentStatus() != ClaimStatus.COMPLETED) {
            throw new BadRequestException("Customer feedback can only be submitted for completed claims. Current status: " + claim.getCurrentStatus());
        }

        if (claim.getCustomerRating() != null) {
            throw new BadRequestException("Feedback has already been submitted for this claim.");
        }

        claim.setCustomerRating(request.getRating());
        claim.setCustomerFeedback(request.getFeedback() != null ? request.getFeedback().trim() : null);
        claim.setFeedbackSubmittedAt(Instant.now());
        claim.setUpdatedAt(Instant.now());

        claim = claimRepository.save(claim);

        recordHistory(claim.getId(), ClaimStatus.COMPLETED, ClaimStatus.COMPLETED, customer.getEmail(),
                "Customer rating: " + request.getRating() + "/5 stars" + (request.getFeedback() != null ? " - " + request.getFeedback() : ""));

        Retailer retailer = retailerRepository.findById(claim.getRetailerId()).orElse(null);
        if (retailer != null) {
            notificationService.sendNotification(
                    retailer.getUserId(),
                    NotificationType.CLAIM_STATUS_CHANGED,
                    "Customer left a " + request.getRating() + "-star rating on resolved claim ID: " + claim.getId(),
                    claim.getId(),
                    "Claim"
            );
        }

        auditService.logAction(customerId, customer.getEmail(), "CLAIM_FEEDBACK_SUBMITTED", "Claim", claim.getId(),
                "Rating: " + request.getRating());

        return mapToResponse(claim);
    }
}

