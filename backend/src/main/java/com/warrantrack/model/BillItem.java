package com.warrantrack.model;

import com.warrantrack.model.enums.WarrantyUnit;
import java.time.LocalDate;

public class BillItem {
    private String productId;
    private String productName;
    private String brand;
    private String category;
    private String serialNumber;
    private int quantity = 1;
    private Double unitPrice = 0.0;
    private Double lineTotal = 0.0;
    private boolean hasWarranty = true;
    private Integer warrantyDuration;
    private WarrantyUnit warrantyUnit;
    private String warrantyTerms;
    private String purchaseId;
    private String warrantyId;
    private String qrToken;
    private LocalDate warrantyExpiryDate;

    public BillItem() {
    }

    public BillItem(String productId, String productName, String brand, String category, String serialNumber, int quantity, Double unitPrice, Double lineTotal, boolean hasWarranty, Integer warrantyDuration, WarrantyUnit warrantyUnit, String warrantyTerms, String purchaseId, String warrantyId, String qrToken, LocalDate warrantyExpiryDate) {
        this.productId = productId;
        this.productName = productName;
        this.brand = brand;
        this.category = category;
        this.serialNumber = serialNumber;
        this.quantity = quantity;
        this.unitPrice = unitPrice != null ? unitPrice : 0.0;
        this.lineTotal = lineTotal != null ? lineTotal : 0.0;
        this.hasWarranty = hasWarranty;
        this.warrantyDuration = warrantyDuration;
        this.warrantyUnit = warrantyUnit;
        this.warrantyTerms = warrantyTerms;
        this.purchaseId = purchaseId;
        this.warrantyId = warrantyId;
        this.qrToken = qrToken;
        this.warrantyExpiryDate = warrantyExpiryDate;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public Double getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(Double unitPrice) {
        this.unitPrice = unitPrice;
    }

    public Double getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(Double lineTotal) {
        this.lineTotal = lineTotal;
    }

    public boolean isHasWarranty() {
        return hasWarranty;
    }

    public void setHasWarranty(boolean hasWarranty) {
        this.hasWarranty = hasWarranty;
    }

    public Integer getWarrantyDuration() {
        return warrantyDuration;
    }

    public void setWarrantyDuration(Integer warrantyDuration) {
        this.warrantyDuration = warrantyDuration;
    }

    public WarrantyUnit getWarrantyUnit() {
        return warrantyUnit;
    }

    public void setWarrantyUnit(WarrantyUnit warrantyUnit) {
        this.warrantyUnit = warrantyUnit;
    }

    public String getWarrantyTerms() {
        return warrantyTerms;
    }

    public void setWarrantyTerms(String warrantyTerms) {
        this.warrantyTerms = warrantyTerms;
    }

    public String getPurchaseId() {
        return purchaseId;
    }

    public void setPurchaseId(String purchaseId) {
        this.purchaseId = purchaseId;
    }

    public String getWarrantyId() {
        return warrantyId;
    }

    public void setWarrantyId(String warrantyId) {
        this.warrantyId = warrantyId;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public LocalDate getWarrantyExpiryDate() {
        return warrantyExpiryDate;
    }

    public void setWarrantyExpiryDate(LocalDate warrantyExpiryDate) {
        this.warrantyExpiryDate = warrantyExpiryDate;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String productId;
        private String productName;
        private String brand;
        private String category;
        private String serialNumber;
        private int quantity = 1;
        private Double unitPrice = 0.0;
        private Double lineTotal = 0.0;
        private boolean hasWarranty = true;
        private Integer warrantyDuration;
        private WarrantyUnit warrantyUnit;
        private String warrantyTerms;
        private String purchaseId;
        private String warrantyId;
        private String qrToken;
        private LocalDate warrantyExpiryDate;

        public Builder productId(String productId) {
            this.productId = productId;
            return this;
        }

        public Builder productName(String productName) {
            this.productName = productName;
            return this;
        }

        public Builder brand(String brand) {
            this.brand = brand;
            return this;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder serialNumber(String serialNumber) {
            this.serialNumber = serialNumber;
            return this;
        }

        public Builder quantity(int quantity) {
            this.quantity = quantity;
            return this;
        }

        public Builder unitPrice(Double unitPrice) {
            this.unitPrice = unitPrice;
            return this;
        }

        public Builder lineTotal(Double lineTotal) {
            this.lineTotal = lineTotal;
            return this;
        }

        public Builder hasWarranty(boolean hasWarranty) {
            this.hasWarranty = hasWarranty;
            return this;
        }

        public Builder warrantyDuration(Integer warrantyDuration) {
            this.warrantyDuration = warrantyDuration;
            return this;
        }

        public Builder warrantyUnit(WarrantyUnit warrantyUnit) {
            this.warrantyUnit = warrantyUnit;
            return this;
        }

        public Builder warrantyTerms(String warrantyTerms) {
            this.warrantyTerms = warrantyTerms;
            return this;
        }

        public Builder purchaseId(String purchaseId) {
            this.purchaseId = purchaseId;
            return this;
        }

        public Builder warrantyId(String warrantyId) {
            this.warrantyId = warrantyId;
            return this;
        }

        public Builder qrToken(String qrToken) {
            this.qrToken = qrToken;
            return this;
        }

        public Builder warrantyExpiryDate(LocalDate warrantyExpiryDate) {
            this.warrantyExpiryDate = warrantyExpiryDate;
            return this;
        }

        public BillItem build() {
            return new BillItem(productId, productName, brand, category, serialNumber, quantity, unitPrice, lineTotal, hasWarranty, warrantyDuration, warrantyUnit, warrantyTerms, purchaseId, warrantyId, qrToken, warrantyExpiryDate);
        }
    }
}

