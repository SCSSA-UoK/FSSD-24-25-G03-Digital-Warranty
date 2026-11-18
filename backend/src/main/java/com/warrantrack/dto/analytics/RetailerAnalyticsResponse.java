package com.warrantrack.dto.analytics;

import java.util.Map;

public class RetailerAnalyticsResponse {
    private long totalProducts;
    private long activeProducts;
    private long totalPurchases;
    private long totalWarranties;
    private long totalClaims;
    private long pendingClaims;
    private Map<String, Long> claimsByStatus;


    public RetailerAnalyticsResponse() {
    }

    public RetailerAnalyticsResponse(long totalProducts, long activeProducts, long totalPurchases, long totalWarranties, long totalClaims, long pendingClaims, Map<String, Long> claimsByStatus) {
        this.totalProducts = totalProducts;
        this.activeProducts = activeProducts;
        this.totalPurchases = totalPurchases;
        this.totalWarranties = totalWarranties;
        this.totalClaims = totalClaims;
        this.pendingClaims = pendingClaims;
        this.claimsByStatus = claimsByStatus;
    }

    public long getTotalProducts() {
        return this.totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getActiveProducts() {
        return this.activeProducts;
    }

    public void setActiveProducts(long activeProducts) {
        this.activeProducts = activeProducts;
    }

    public long getTotalPurchases() {
        return this.totalPurchases;
    }

    public void setTotalPurchases(long totalPurchases) {
        this.totalPurchases = totalPurchases;
    }

    public long getTotalWarranties() {
        return this.totalWarranties;
    }

    public void setTotalWarranties(long totalWarranties) {
        this.totalWarranties = totalWarranties;
    }

    public long getTotalClaims() {
        return this.totalClaims;
    }

    public void setTotalClaims(long totalClaims) {
        this.totalClaims = totalClaims;
    }

    public long getPendingClaims() {
        return this.pendingClaims;
    }

    public void setPendingClaims(long pendingClaims) {
        this.pendingClaims = pendingClaims;
    }

    public Map<String, Long> getClaimsByStatus() {
        return this.claimsByStatus;
    }

    public void setClaimsByStatus(Map<String, Long> claimsByStatus) {
        this.claimsByStatus = claimsByStatus;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private long totalProducts;
        private long activeProducts;
        private long totalPurchases;
        private long totalWarranties;
        private long totalClaims;
        private long pendingClaims;
        private Map<String, Long> claimsByStatus;

        public Builder() {}

        public Builder totalProducts(long totalProducts) {
            this.totalProducts = totalProducts;
            return this;
        }

        public Builder activeProducts(long activeProducts) {
            this.activeProducts = activeProducts;
            return this;
        }

        public Builder totalPurchases(long totalPurchases) {
            this.totalPurchases = totalPurchases;
            return this;
        }

        public Builder totalWarranties(long totalWarranties) {
            this.totalWarranties = totalWarranties;
            return this;
        }

        public Builder totalClaims(long totalClaims) {
            this.totalClaims = totalClaims;
            return this;
        }

        public Builder pendingClaims(long pendingClaims) {
            this.pendingClaims = pendingClaims;
            return this;
        }

        public Builder claimsByStatus(Map<String, Long> claimsByStatus) {
            this.claimsByStatus = claimsByStatus;
            return this;
        }

        public RetailerAnalyticsResponse build() {
            return new RetailerAnalyticsResponse(this.totalProducts, this.activeProducts, this.totalPurchases, this.totalWarranties, this.totalClaims, this.pendingClaims, this.claimsByStatus);
        }
    }

}
