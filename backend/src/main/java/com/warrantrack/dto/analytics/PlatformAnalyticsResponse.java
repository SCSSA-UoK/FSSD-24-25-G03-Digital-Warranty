package com.warrantrack.dto.analytics;

import java.util.Map;

public class PlatformAnalyticsResponse {
    private long totalRetailers;
    private long approvedRetailers;
    private long pendingRetailers;
    private long suspendedRetailers;
    private long totalCustomers;
    private long totalProducts;
    private long totalPurchases;
    private long totalWarranties;
    private long totalClaims;
    private Map<String, Long> claimsByStatus;
    private Map<String, Long> monthlyCustomerRegistrations;

    public PlatformAnalyticsResponse() {
    }

    public PlatformAnalyticsResponse(long totalRetailers, long approvedRetailers, long pendingRetailers, long suspendedRetailers, long totalCustomers, long totalProducts, long totalPurchases, long totalWarranties, long totalClaims, Map<String, Long> claimsByStatus) {
        this(totalRetailers, approvedRetailers, pendingRetailers, suspendedRetailers, totalCustomers, totalProducts, totalPurchases, totalWarranties, totalClaims, claimsByStatus, null);
    }

    public PlatformAnalyticsResponse(long totalRetailers, long approvedRetailers, long pendingRetailers, long suspendedRetailers, long totalCustomers, long totalProducts, long totalPurchases, long totalWarranties, long totalClaims, Map<String, Long> claimsByStatus, Map<String, Long> monthlyCustomerRegistrations) {
        this.totalRetailers = totalRetailers;
        this.approvedRetailers = approvedRetailers;
        this.pendingRetailers = pendingRetailers;
        this.suspendedRetailers = suspendedRetailers;
        this.totalCustomers = totalCustomers;
        this.totalProducts = totalProducts;
        this.totalPurchases = totalPurchases;
        this.totalWarranties = totalWarranties;
        this.totalClaims = totalClaims;
        this.claimsByStatus = claimsByStatus;
        this.monthlyCustomerRegistrations = monthlyCustomerRegistrations;
    }

    public long getTotalRetailers() {
        return this.totalRetailers;
    }

    public void setTotalRetailers(long totalRetailers) {
        this.totalRetailers = totalRetailers;
    }

    public long getApprovedRetailers() {
        return this.approvedRetailers;
    }

    public void setApprovedRetailers(long approvedRetailers) {
        this.approvedRetailers = approvedRetailers;
    }

    public long getPendingRetailers() {
        return this.pendingRetailers;
    }

    public void setPendingRetailers(long pendingRetailers) {
        this.pendingRetailers = pendingRetailers;
    }

    public long getSuspendedRetailers() {
        return this.suspendedRetailers;
    }

    public void setSuspendedRetailers(long suspendedRetailers) {
        this.suspendedRetailers = suspendedRetailers;
    }

    public long getTotalCustomers() {
        return this.totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getTotalProducts() {
        return this.totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
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

    public Map<String, Long> getClaimsByStatus() {
        return this.claimsByStatus;
    }

    public void setClaimsByStatus(Map<String, Long> claimsByStatus) {
        this.claimsByStatus = claimsByStatus;
    }

    public Map<String, Long> getMonthlyCustomerRegistrations() {
        return this.monthlyCustomerRegistrations;
    }

    public void setMonthlyCustomerRegistrations(Map<String, Long> monthlyCustomerRegistrations) {
        this.monthlyCustomerRegistrations = monthlyCustomerRegistrations;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private long totalRetailers;
        private long approvedRetailers;
        private long pendingRetailers;
        private long suspendedRetailers;
        private long totalCustomers;
        private long totalProducts;
        private long totalPurchases;
        private long totalWarranties;
        private long totalClaims;
        private Map<String, Long> claimsByStatus;
        private Map<String, Long> monthlyCustomerRegistrations;

        public Builder() {}

        public Builder totalRetailers(long totalRetailers) {
            this.totalRetailers = totalRetailers;
            return this;
        }

        public Builder approvedRetailers(long approvedRetailers) {
            this.approvedRetailers = approvedRetailers;
            return this;
        }

        public Builder pendingRetailers(long pendingRetailers) {
            this.pendingRetailers = pendingRetailers;
            return this;
        }

        public Builder suspendedRetailers(long suspendedRetailers) {
            this.suspendedRetailers = suspendedRetailers;
            return this;
        }

        public Builder totalCustomers(long totalCustomers) {
            this.totalCustomers = totalCustomers;
            return this;
        }

        public Builder totalProducts(long totalProducts) {
            this.totalProducts = totalProducts;
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

        public Builder claimsByStatus(Map<String, Long> claimsByStatus) {
            this.claimsByStatus = claimsByStatus;
            return this;
        }

        public Builder monthlyCustomerRegistrations(Map<String, Long> monthlyCustomerRegistrations) {
            this.monthlyCustomerRegistrations = monthlyCustomerRegistrations;
            return this;
        }

        public PlatformAnalyticsResponse build() {
            return new PlatformAnalyticsResponse(this.totalRetailers, this.approvedRetailers, this.pendingRetailers, this.suspendedRetailers, this.totalCustomers, this.totalProducts, this.totalPurchases, this.totalWarranties, this.totalClaims, this.claimsByStatus, this.monthlyCustomerRegistrations);
        }
    }
}
