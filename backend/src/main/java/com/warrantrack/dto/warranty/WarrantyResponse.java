package com.warrantrack.dto.warranty;

import com.warrantrack.model.enums.WarrantyStatus;
import com.warrantrack.model.enums.WarrantyUnit;
import java.time.Instant;
import java.time.LocalDate;

public class WarrantyResponse {
    private String id;
    private String purchaseId;
    private String retailerId;
    private String retailerBusinessName;
    private String customerId;
    private String productId;
    private String productName;
    private String productBrand;
    private String productModel;
    private String serialNumber;
    private String invoiceNumber;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private WarrantyStatus status;
    private String termsSnapshot;
    private int warrantyDurationSnapshot;
    private WarrantyUnit warrantyUnitSnapshot;
    private String qrToken;
    private boolean eligibleForClaim;
    private Instant createdAt;


    public WarrantyResponse() {
    }

    public WarrantyResponse(String id, String purchaseId, String retailerId, String retailerBusinessName, String customerId, String productId, String productName, String productBrand, String productModel, LocalDate startDate, LocalDate expiryDate, WarrantyStatus status, String termsSnapshot, int warrantyDurationSnapshot, WarrantyUnit warrantyUnitSnapshot, String qrToken, boolean eligibleForClaim, Instant createdAt) {
        this.id = id;
        this.purchaseId = purchaseId;
        this.retailerId = retailerId;
        this.retailerBusinessName = retailerBusinessName;
        this.customerId = customerId;
        this.productId = productId;
        this.productName = productName;
        this.productBrand = productBrand;
        this.productModel = productModel;
        this.startDate = startDate;
        this.expiryDate = expiryDate;
        this.status = status;
        this.termsSnapshot = termsSnapshot;
        this.warrantyDurationSnapshot = warrantyDurationSnapshot;
        this.warrantyUnitSnapshot = warrantyUnitSnapshot;
        this.qrToken = qrToken;
        this.eligibleForClaim = eligibleForClaim;
        this.createdAt = createdAt;
    }

    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPurchaseId() {
        return this.purchaseId;
    }

    public void setPurchaseId(String purchaseId) {
        this.purchaseId = purchaseId;
    }

    public String getRetailerId() {
        return this.retailerId;
    }

    public void setRetailerId(String retailerId) {
        this.retailerId = retailerId;
    }

    public String getRetailerBusinessName() {
        return this.retailerBusinessName;
    }

    public void setRetailerBusinessName(String retailerBusinessName) {
        this.retailerBusinessName = retailerBusinessName;
    }

    public String getCustomerId() {
        return this.customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getProductId() {
        return this.productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return this.productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductBrand() {
        return this.productBrand;
    }

    public void setProductBrand(String productBrand) {
        this.productBrand = productBrand;
    }

    public String getProductModel() {
        return this.productModel;
    }

    public void setProductModel(String productModel) {
        this.productModel = productModel;
    }

    public String getSerialNumber() {
        return this.serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getInvoiceNumber() {
        return this.invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public LocalDate getStartDate() {
        return this.startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getExpiryDate() {
        return this.expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public WarrantyStatus getStatus() {
        return this.status;
    }

    public void setStatus(WarrantyStatus status) {
        this.status = status;
    }

    public String getTermsSnapshot() {
        return this.termsSnapshot;
    }

    public void setTermsSnapshot(String termsSnapshot) {
        this.termsSnapshot = termsSnapshot;
    }

    public int getWarrantyDurationSnapshot() {
        return this.warrantyDurationSnapshot;
    }

    public void setWarrantyDurationSnapshot(int warrantyDurationSnapshot) {
        this.warrantyDurationSnapshot = warrantyDurationSnapshot;
    }

    public WarrantyUnit getWarrantyUnitSnapshot() {
        return this.warrantyUnitSnapshot;
    }

    public void setWarrantyUnitSnapshot(WarrantyUnit warrantyUnitSnapshot) {
        this.warrantyUnitSnapshot = warrantyUnitSnapshot;
    }

    public String getQrToken() {
        return this.qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public boolean isEligibleForClaim() {
        return this.eligibleForClaim;
    }

    public void setEligibleForClaim(boolean eligibleForClaim) {
        this.eligibleForClaim = eligibleForClaim;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String purchaseId;
        private String retailerId;
        private String retailerBusinessName;
        private String customerId;
        private String productId;
        private String productName;
        private String productBrand;
        private String productModel;
        private String serialNumber;
        private String invoiceNumber;
        private LocalDate startDate;
        private LocalDate expiryDate;
        private WarrantyStatus status;
        private String termsSnapshot;
        private int warrantyDurationSnapshot;
        private WarrantyUnit warrantyUnitSnapshot;
        private String qrToken;
        private boolean eligibleForClaim;
        private Instant createdAt;

        public Builder() {}

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder purchaseId(String purchaseId) {
            this.purchaseId = purchaseId;
            return this;
        }

        public Builder retailerId(String retailerId) {
            this.retailerId = retailerId;
            return this;
        }

        public Builder retailerBusinessName(String retailerBusinessName) {
            this.retailerBusinessName = retailerBusinessName;
            return this;
        }

        public Builder customerId(String customerId) {
            this.customerId = customerId;
            return this;
        }

        public Builder productId(String productId) {
            this.productId = productId;
            return this;
        }

        public Builder productName(String productName) {
            this.productName = productName;
            return this;
        }

        public Builder productBrand(String productBrand) {
            this.productBrand = productBrand;
            return this;
        }

        public Builder productModel(String productModel) {
            this.productModel = productModel;
            return this;
        }

        public Builder serialNumber(String serialNumber) {
            this.serialNumber = serialNumber;
            return this;
        }

        public Builder invoiceNumber(String invoiceNumber) {
            this.invoiceNumber = invoiceNumber;
            return this;
        }

        public Builder startDate(LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        public Builder expiryDate(LocalDate expiryDate) {
            this.expiryDate = expiryDate;
            return this;
        }

        public Builder status(WarrantyStatus status) {
            this.status = status;
            return this;
        }

        public Builder termsSnapshot(String termsSnapshot) {
            this.termsSnapshot = termsSnapshot;
            return this;
        }

        public Builder warrantyDurationSnapshot(int warrantyDurationSnapshot) {
            this.warrantyDurationSnapshot = warrantyDurationSnapshot;
            return this;
        }

        public Builder warrantyUnitSnapshot(WarrantyUnit warrantyUnitSnapshot) {
            this.warrantyUnitSnapshot = warrantyUnitSnapshot;
            return this;
        }

        public Builder qrToken(String qrToken) {
            this.qrToken = qrToken;
            return this;
        }

        public Builder eligibleForClaim(boolean eligibleForClaim) {
            this.eligibleForClaim = eligibleForClaim;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public WarrantyResponse build() {
            WarrantyResponse res = new WarrantyResponse(this.id, this.purchaseId, this.retailerId, this.retailerBusinessName, this.customerId, this.productId, this.productName, this.productBrand, this.productModel, this.startDate, this.expiryDate, this.status, this.termsSnapshot, this.warrantyDurationSnapshot, this.warrantyUnitSnapshot, this.qrToken, this.eligibleForClaim, this.createdAt);
            res.setSerialNumber(this.serialNumber);
            res.setInvoiceNumber(this.invoiceNumber);
            return res;
        }
    }

}
