package com.warrantrack.service;

import com.warrantrack.dto.analytics.PlatformAnalyticsResponse;
import com.warrantrack.dto.analytics.RetailerAnalyticsResponse;
import com.warrantrack.model.Retailer;
import com.warrantrack.model.enums.ClaimStatus;
import com.warrantrack.repository.ClaimRepository;
import com.warrantrack.repository.ProductRepository;
import com.warrantrack.repository.PurchaseRepository;
import com.warrantrack.repository.WarrantyRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AnalyticsService {

    private final AdminService adminService;
    private final RetailerService retailerService;
    private final ProductRepository productRepository;
    private final PurchaseRepository purchaseRepository;
    private final WarrantyRepository warrantyRepository;
    private final ClaimRepository claimRepository;

    public AnalyticsService(AdminService adminService, RetailerService retailerService, ProductRepository productRepository, PurchaseRepository purchaseRepository, WarrantyRepository warrantyRepository, ClaimRepository claimRepository) {
        this.adminService = adminService;
        this.retailerService = retailerService;
        this.productRepository = productRepository;
        this.purchaseRepository = purchaseRepository;
        this.warrantyRepository = warrantyRepository;
        this.claimRepository = claimRepository;
    }

    public PlatformAnalyticsResponse getPlatformAnalytics() {
        return adminService.getPlatformAnalytics();
    }

    public RetailerAnalyticsResponse getRetailerAnalytics(String userId) {
        Retailer retailer = retailerService.getRetailerByUserId(userId);
        String retailerId = retailer.getId();

        long totalProducts = productRepository.countByRetailerId(retailerId);
        long activeProducts = productRepository.findByRetailerIdAndActiveTrue(retailerId, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long totalPurchases = purchaseRepository.findByRetailerId(retailerId, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long totalWarranties = warrantyRepository.countByRetailerId(retailerId);
        long totalClaims = claimRepository.countByRetailerId(retailerId);
        long pendingClaims = claimRepository.countByRetailerIdAndCurrentStatus(retailerId, ClaimStatus.SUBMITTED)
                + claimRepository.countByRetailerIdAndCurrentStatus(retailerId, ClaimStatus.UNDER_REVIEW);

        Map<String, Long> claimsByStatus = new HashMap<>();
        for (ClaimStatus status : ClaimStatus.values()) {
            claimsByStatus.put(status.name(), claimRepository.countByRetailerIdAndCurrentStatus(retailerId, status));
        }

        return RetailerAnalyticsResponse.builder()
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .totalPurchases(totalPurchases)
                .totalWarranties(totalWarranties)
                .totalClaims(totalClaims)
                .pendingClaims(pendingClaims)
                .claimsByStatus(claimsByStatus)
                .build();
    }
}

