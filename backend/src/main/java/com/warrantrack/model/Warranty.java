package com.warrantrack.model;

import com.warrantrack.model.enums.WarrantyStatus;
import com.warrantrack.model.enums.WarrantyUnit;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "warranties")
public class Warranty {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String purchaseId;

    private String retailerId;

    private String customerId;

    private String productId;

    private String productName;

    private LocalDate startDate;

    private LocalDate expiryDate;

    private WarrantyStatus status = WarrantyStatus.ACTIVE;

    private String termsSnapshot;

    private int warrantyDurationSnapshot;

    private WarrantyUnit warrantyUnitSnapshot;

    @Indexed(unique = true, sparse = true)
    private String qrToken;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;


    public Warranty() {
    }

    public Warranty(String id, String purchaseId, String retailerId, String customerId, String productId, String productName, LocalDate startDate, LocalDate expiryDate, WarrantyStatus status, String termsSnapshot, int warrantyDurationSnapshot, WarrantyUnit warrantyUnitSnapshot, String qrToken, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.purchaseId = purchaseId;
        this.retailerId = retailerId;
        this.customerId = customerId;
        this.productId = productId;
        this.productName = productName;
        this.startDate = startDate;
        this.expiryDate = expiryDate;
        this.status = status;
        this.termsSnapshot = termsSnapshot;
        this.warrantyDurationSnapshot = warrantyDurationSnapshot;
        this.warrantyUnitSnapshot = warrantyUnitSnapshot;
        this.qrToken = qrToken;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return this.updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String purchaseId;
        private String retailerId;
        private String customerId;
        private String productId;
        private String productName;
        private LocalDate startDate;
        private LocalDate expiryDate;
        private WarrantyStatus status = WarrantyStatus.ACTIVE;
        private String termsSnapshot;
        private int warrantyDurationSnapshot;
        private WarrantyUnit warrantyUnitSnapshot;
        private String qrToken;
        private Instant createdAt;
        private Instant updatedAt;

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

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Warranty build() {
            return new Warranty(this.id, this.purchaseId, this.retailerId, this.customerId, this.productId, this.productName, this.startDate, this.expiryDate, this.status, this.termsSnapshot, this.warrantyDurationSnapshot, this.warrantyUnitSnapshot, this.qrToken, this.createdAt, this.updatedAt);
        }
    }

}
