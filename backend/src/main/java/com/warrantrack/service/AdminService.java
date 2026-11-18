package com.warrantrack.service;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.analytics.PlatformAnalyticsResponse;
import com.warrantrack.dto.auth.UserResponse;
import com.warrantrack.dto.admin.CustomerStatusUpdateRequest;
import com.warrantrack.dto.retailer.RetailerResponse;
import com.warrantrack.dto.retailer.RetailerStatusUpdateRequest;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.model.Retailer;
import com.warrantrack.model.User;
import com.warrantrack.model.enums.AccountStatus;
import com.warrantrack.model.enums.ApprovalStatus;
import com.warrantrack.model.enums.ClaimStatus;
import com.warrantrack.model.enums.NotificationType;
import com.warrantrack.model.enums.Role;
import com.warrantrack.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {
    private static final Logger log = LoggerFactory.getLogger(AdminService.class);


    private final RetailerRepository retailerRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PurchaseRepository purchaseRepository;
    private final WarrantyRepository warrantyRepository;
    private final ClaimRepository claimRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final RetailerService retailerService;

    public AdminService(RetailerRepository retailerRepository, UserRepository userRepository, ProductRepository productRepository, PurchaseRepository purchaseRepository, WarrantyRepository warrantyRepository, ClaimRepository claimRepository, NotificationService notificationService, AuditService auditService, RetailerService retailerService) {
        this.retailerRepository = retailerRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.purchaseRepository = purchaseRepository;
        this.warrantyRepository = warrantyRepository;
        this.claimRepository = claimRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.retailerService = retailerService;
    }

    public PagedResponse<RetailerResponse> getRetailers(ApprovalStatus status, Pageable pageable) {
        Page<Retailer> page = (status != null)
                ? retailerRepository.findByApprovalStatus(status, pageable)
                : retailerRepository.findAll(pageable);

        List<RetailerResponse> content = page.getContent().stream()
                .map(retailerService::mapToResponse)
                .toList();

        return PagedResponse.<RetailerResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public RetailerResponse getRetailerById(String id) {
        Retailer retailer = retailerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Retailer", "id", id));
        return retailerService.mapToResponse(retailer);
    }

    @Transactional
    public RetailerResponse updateRetailerStatus(String retailerId, RetailerStatusUpdateRequest request, String adminId, String adminEmail) {
        Retailer retailer = retailerRepository.findById(retailerId)
                .orElseThrow(() -> new ResourceNotFoundException("Retailer", "id", retailerId));

        ApprovalStatus newStatus = request.getStatus();
        ApprovalStatus oldStatus = retailer.getApprovalStatus();

        if (newStatus == ApprovalStatus.REJECTED && (request.getReason() == null || request.getReason().isBlank())) {
            throw new BadRequestException("Rejection reason is mandatory when rejecting a retailer application.");
        }
        if (newStatus == ApprovalStatus.SUSPENDED && (request.getReason() == null || request.getReason().isBlank())) {
            throw new BadRequestException("Suspension reason is mandatory when suspending an approved retailer.");
        }

        retailer.setApprovalStatus(newStatus);
        retailer.setUpdatedAt(Instant.now());

        if (newStatus == ApprovalStatus.APPROVED) {
            retailer.setApprovedBy(adminEmail);
            retailer.setApprovedAt(Instant.now());
            retailer.setRejectionReason(null);
            retailer.setSuspensionReason(null);
            notificationService.sendNotification(retailer.getUserId(), NotificationType.RETAILER_APPROVED,
                    "Congratulations! Your retailer account has been approved by the platform administrator.",
                    retailer.getId(), "Retailer");
        } else if (newStatus == ApprovalStatus.REJECTED) {
            retailer.setRejectionReason(request.getReason());
        } else if (newStatus == ApprovalStatus.SUSPENDED) {
            retailer.setSuspensionReason(request.getReason());
            notificationService.sendNotification(retailer.getUserId(), NotificationType.RETAILER_SUSPENDED,
                    "Your retailer account has been suspended: " + request.getReason(),
                    retailer.getId(), "Retailer");
        }

        retailer = retailerRepository.save(retailer);

        auditService.logAction(adminId, adminEmail, "UPDATE_RETAILER_STATUS", "Retailer", retailerId,
                String.format("Changed status from %s to %s. Reason: %s", oldStatus, newStatus, request.getReason()));

        return retailerService.mapToResponse(retailer);
    }

    public PagedResponse<UserResponse> getCustomers(Pageable pageable) {
        return getCustomers(null, null, pageable);
    }

    public PagedResponse<UserResponse> getCustomers(AccountStatus status, String search, Pageable pageable) {
        List<User> customers = userRepository.findByRole(Role.CUSTOMER);

        if (status != null) {
            customers = customers.stream()
                    .filter(u -> u.getAccountStatus() == status || (status == AccountStatus.INACTIVE && u.getAccountStatus() == AccountStatus.DEACTIVATED))
                    .toList();
        }

        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            customers = customers.stream()
                    .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(q))
                            || (u.getEmail() != null && u.getEmail().toLowerCase().contains(q))
                            || (u.getPhone() != null && u.getPhone().toLowerCase().contains(q)))
                    .toList();
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), customers.size());
        List<UserResponse> list = (start <= end && start < customers.size())
                ? customers.subList(start, end).stream().map(this::mapUserToResponse).toList()
                : List.of();

        return PagedResponse.<UserResponse>builder()
                .content(list)
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .totalElements(customers.size())
                .totalPages((int) Math.ceil((double) customers.size() / pageable.getPageSize()))
                .last(end >= customers.size())
                .build();
    }

    @Transactional
    public UserResponse updateCustomerStatus(String customerId, CustomerStatusUpdateRequest request, String adminId, String adminEmail) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

        if (customer.getRole() != Role.CUSTOMER) {
            throw new BadRequestException("Target user is not a customer.");
        }

        AccountStatus newStatus = request.getStatus();
        AccountStatus oldStatus = customer.getAccountStatus();

        if (newStatus == AccountStatus.SUSPENDED && (request.getReason() == null || request.getReason().isBlank())) {
            throw new BadRequestException("Suspension reason is mandatory when suspending a customer account.");
        }

        customer.setAccountStatus(newStatus);
        customer.setStatusReason(request.getReason());
        customer.setStatusChangedAt(Instant.now());
        customer.setStatusChangedBy(adminEmail);
        customer.setUpdatedAt(Instant.now());

        customer = userRepository.save(customer);

        NotificationType notifType = switch (newStatus) {
            case SUSPENDED -> NotificationType.CUSTOMER_ACCOUNT_SUSPENDED;
            case INACTIVE, DEACTIVATED -> NotificationType.CUSTOMER_ACCOUNT_DEACTIVATED;
            case ACTIVE -> NotificationType.CUSTOMER_ACCOUNT_ACTIVATED;
        };

        String notifMsg = switch (newStatus) {
            case SUSPENDED -> "Your customer account has been suspended: " + (request.getReason() != null ? request.getReason() : "Administrative action.");
            case INACTIVE, DEACTIVATED -> "Your customer account status has been changed to inactive.";
            case ACTIVE -> "Your customer account has been restored to active status.";
        };

        notificationService.sendNotification(customer.getId(), notifType, notifMsg, customer.getId(), "User");

        auditService.logAction(adminId, adminEmail, "UPDATE_CUSTOMER_STATUS", "User", customerId,
                String.format("Changed customer status from %s to %s. Reason: %s", oldStatus, newStatus, request.getReason()));

        return mapUserToResponse(customer);
    }

    public PlatformAnalyticsResponse getPlatformAnalytics() {
        long totalRetailers = retailerRepository.count();
        long approvedRetailers = retailerRepository.findAll().stream()
                .filter(r -> r.getApprovalStatus() == ApprovalStatus.APPROVED).count();
        long pendingRetailers = retailerRepository.findAll().stream()
                .filter(r -> r.getApprovalStatus() == ApprovalStatus.PENDING).count();
        long suspendedRetailers = retailerRepository.findAll().stream()
                .filter(r -> r.getApprovalStatus() == ApprovalStatus.SUSPENDED).count();

        List<User> customers = userRepository.findByRole(Role.CUSTOMER);
        long totalCustomers = customers.size();
        long totalProducts = productRepository.count();
        long totalPurchases = purchaseRepository.count();
        long totalWarranties = warrantyRepository.count();
        long totalClaims = claimRepository.count();

        Map<String, Long> claimsByStatus = new HashMap<>();
        for (ClaimStatus status : ClaimStatus.values()) {
            claimsByStatus.put(status.name(), claimRepository.countByCurrentStatus(status));
        }

        // Calculate month-wise registered customers for past 6 months
        Map<String, Long> monthlyCustomerRegistrations = new java.util.LinkedHashMap<>();
        java.time.YearMonth currentMonth = java.time.YearMonth.now();
        java.time.format.DateTimeFormatter monthFormatter = java.time.format.DateTimeFormatter.ofPattern("MMM yyyy");
        for (int i = 5; i >= 0; i--) {
            java.time.YearMonth ym = currentMonth.minusMonths(i);
            monthlyCustomerRegistrations.put(ym.format(monthFormatter), 0L);
        }

        for (User c : customers) {
            if (c.getCreatedAt() != null) {
                java.time.YearMonth ym = java.time.YearMonth.from(c.getCreatedAt().atZone(java.time.ZoneId.systemDefault()));
                String key = ym.format(monthFormatter);
                if (monthlyCustomerRegistrations.containsKey(key)) {
                    monthlyCustomerRegistrations.put(key, monthlyCustomerRegistrations.get(key) + 1L);
                }
            } else {
                String key = currentMonth.format(monthFormatter);
                monthlyCustomerRegistrations.put(key, monthlyCustomerRegistrations.getOrDefault(key, 0L) + 1L);
            }
        }

        return PlatformAnalyticsResponse.builder()
                .totalRetailers(totalRetailers)
                .approvedRetailers(approvedRetailers)
                .pendingRetailers(pendingRetailers)
                .suspendedRetailers(suspendedRetailers)
                .totalCustomers(totalCustomers)
                .totalProducts(totalProducts)
                .totalPurchases(totalPurchases)
                .totalWarranties(totalWarranties)
                .totalClaims(totalClaims)
                .claimsByStatus(claimsByStatus)
                .monthlyCustomerRegistrations(monthlyCustomerRegistrations)
                .build();
    }

    private UserResponse mapUserToResponse(User u) {
        long warrantiesCount = u.getId() != null ? warrantyRepository.countByCustomerId(u.getId()) : 0L;
        long claimsCount = u.getId() != null ? claimRepository.countByCustomerId(u.getId()) : 0L;

        return UserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole())
                .emailVerified(u.isEmailVerified())
                .accountStatus(u.getAccountStatus())
                .statusReason(u.getStatusReason())
                .statusChangedAt(u.getStatusChangedAt())
                .statusChangedBy(u.getStatusChangedBy())
                .warrantiesCount(warrantiesCount)
                .claimsCount(claimsCount)
                .createdAt(u.getCreatedAt())
                .build();
    }
}

