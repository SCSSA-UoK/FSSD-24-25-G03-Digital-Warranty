package com.warrantrack.dto.warranty;

import com.warrantrack.model.enums.WarrantyStatus;
import java.time.LocalDate;

public class PublicWarrantyResponse {
    private String verificationStatus;
    private String productName;
    private String productBrand;
    private String productModel;
    private String serialNumber;
    private String retailerBusinessName;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private WarrantyStatus status;
    private boolean currentlyValid;
    private String termsSummary;


    public PublicWarrantyResponse() {
    }

    public PublicWarrantyResponse(String verificationStatus, String productName, String productBrand, String productModel, String retailerBusinessName, LocalDate startDate, LocalDate expiryDate, WarrantyStatus status, boolean currentlyValid, String termsSummary) {
        this.verificationStatus = verificationStatus;
        this.productName = productName;
        this.productBrand = productBrand;
        this.productModel = productModel;
        this.retailerBusinessName = retailerBusinessName;
        this.startDate = startDate;
        this.expiryDate = expiryDate;
        this.status = status;
        this.currentlyValid = currentlyValid;
        this.termsSummary = termsSummary;
    }

    public String getVerificationStatus() {
        return this.verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
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

    public String getRetailerBusinessName() {
        return this.retailerBusinessName;
    }

    public void setRetailerBusinessName(String retailerBusinessName) {
        this.retailerBusinessName = retailerBusinessName;
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

    public boolean isCurrentlyValid() {
        return this.currentlyValid;
    }

    public void setCurrentlyValid(boolean currentlyValid) {
        this.currentlyValid = currentlyValid;
    }

    public String getTermsSummary() {
        return this.termsSummary;
    }

    public void setTermsSummary(String termsSummary) {
        this.termsSummary = termsSummary;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String verificationStatus;
        private String productName;
        private String productBrand;
        private String productModel;
        private String serialNumber;
        private String retailerBusinessName;
        private LocalDate startDate;
        private LocalDate expiryDate;
        private WarrantyStatus status;
        private boolean currentlyValid;
        private String termsSummary;

        public Builder() {}

        public Builder verificationStatus(String verificationStatus) {
            this.verificationStatus = verificationStatus;
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

        public Builder retailerBusinessName(String retailerBusinessName) {
            this.retailerBusinessName = retailerBusinessName;
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

        public Builder currentlyValid(boolean currentlyValid) {
            this.currentlyValid = currentlyValid;
            return this;
        }

        public Builder termsSummary(String termsSummary) {
            this.termsSummary = termsSummary;
            return this;
        }

        public PublicWarrantyResponse build() {
            PublicWarrantyResponse res = new PublicWarrantyResponse(this.verificationStatus, this.productName, this.productBrand, this.productModel, this.retailerBusinessName, this.startDate, this.expiryDate, this.status, this.currentlyValid, this.termsSummary);
            res.setSerialNumber(this.serialNumber);
            return res;
        }
    }

}
