package com.warrantrack.dto.retailer;

import com.warrantrack.model.enums.ApprovalStatus;
import java.time.Instant;

public class RetailerResponse {
    private String id;
    private String userId;
    private String businessName;
    private String registrationNumber;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String description;
    private ApprovalStatus approvalStatus;
    private String approvedBy;
    private Instant approvedAt;
    private String rejectionReason;
    private String suspensionReason;
    private Instant createdAt;
    private Instant updatedAt;


    public RetailerResponse() {
    }

    public RetailerResponse(String id, String userId, String businessName, String registrationNumber, String contactEmail, String contactPhone, String address, String description, ApprovalStatus approvalStatus, String approvedBy, Instant approvedAt, String rejectionReason, String suspensionReason, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.businessName = businessName;
        this.registrationNumber = registrationNumber;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.address = address;
        this.description = description;
        this.approvalStatus = approvalStatus;
        this.approvedBy = approvedBy;
        this.approvedAt = approvedAt;
        this.rejectionReason = rejectionReason;
        this.suspensionReason = suspensionReason;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return this.userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getBusinessName() {
        return this.businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getRegistrationNumber() {
        return this.registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getContactEmail() {
        return this.contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return this.contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getAddress() {
        return this.address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDescription() {
        return this.description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ApprovalStatus getApprovalStatus() {
        return this.approvalStatus;
    }

    public void setApprovalStatus(ApprovalStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getApprovedBy() {
        return this.approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public Instant getApprovedAt() {
        return this.approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getRejectionReason() {
        return this.rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getSuspensionReason() {
        return this.suspensionReason;
    }

    public void setSuspensionReason(String suspensionReason) {
        this.suspensionReason = suspensionReason;
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
        private String userId;
        private String businessName;
        private String registrationNumber;
        private String contactEmail;
        private String contactPhone;
        private String address;
        private String description;
        private ApprovalStatus approvalStatus;
        private String approvedBy;
        private Instant approvedAt;
        private String rejectionReason;
        private String suspensionReason;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder() {}

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public Builder businessName(String businessName) {
            this.businessName = businessName;
            return this;
        }

        public Builder registrationNumber(String registrationNumber) {
            this.registrationNumber = registrationNumber;
            return this;
        }

        public Builder contactEmail(String contactEmail) {
            this.contactEmail = contactEmail;
            return this;
        }

        public Builder contactPhone(String contactPhone) {
            this.contactPhone = contactPhone;
            return this;
        }

        public Builder address(String address) {
            this.address = address;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder approvalStatus(ApprovalStatus approvalStatus) {
            this.approvalStatus = approvalStatus;
            return this;
        }

        public Builder approvedBy(String approvedBy) {
            this.approvedBy = approvedBy;
            return this;
        }

        public Builder approvedAt(Instant approvedAt) {
            this.approvedAt = approvedAt;
            return this;
        }

        public Builder rejectionReason(String rejectionReason) {
            this.rejectionReason = rejectionReason;
            return this;
        }

        public Builder suspensionReason(String suspensionReason) {
            this.suspensionReason = suspensionReason;
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

        public RetailerResponse build() {
            return new RetailerResponse(this.id, this.userId, this.businessName, this.registrationNumber, this.contactEmail, this.contactPhone, this.address, this.description, this.approvalStatus, this.approvedBy, this.approvedAt, this.rejectionReason, this.suspensionReason, this.createdAt, this.updatedAt);
        }
    }

}
