package com.warrantrack.dto.claim;

import com.warrantrack.model.Claim;
import com.warrantrack.model.enums.ClaimStatus;
import com.warrantrack.model.enums.ResolutionType;
import java.time.Instant;
import java.util.List;

public class ClaimResponse {
    private String id;
    private String warrantyId;
    private String purchaseId;
    private String retailerId;
    private String retailerBusinessName;
    private String customerId;
    private String customerName;
    private String customerEmail;
    private String productName;
    private String serialNumber;
    private String issueDescription;
    private List<String> evidenceReferences;
    private ClaimStatus currentStatus;
    private String decisionReason;
    private String decisionBy;
    private Instant decisionAt;
    private ResolutionType resolutionType;
    private String resolutionNotes;
    private String cancellationReason;
    private Integer customerRating;
    private String customerFeedback;
    private Instant feedbackSubmittedAt;
    private List<Claim.ServiceNote> serviceNotes;
    private List<ClaimStatusHistoryResponse> statusHistory;
    private Instant createdAt;
    private Instant updatedAt;


    public ClaimResponse() {
    }

    public ClaimResponse(String id, String warrantyId, String purchaseId, String retailerId, String retailerBusinessName, String customerId, String customerName, String customerEmail, String productName, String issueDescription, List<String> evidenceReferences, ClaimStatus currentStatus, String decisionReason, String decisionBy, Instant decisionAt, ResolutionType resolutionType, String resolutionNotes, String cancellationReason, List<Claim.ServiceNote> serviceNotes, List<ClaimStatusHistoryResponse> statusHistory, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.warrantyId = warrantyId;
        this.purchaseId = purchaseId;
        this.retailerId = retailerId;
        this.retailerBusinessName = retailerBusinessName;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.productName = productName;
        this.issueDescription = issueDescription;
        this.evidenceReferences = evidenceReferences;
        this.currentStatus = currentStatus;
        this.decisionReason = decisionReason;
        this.decisionBy = decisionBy;
        this.decisionAt = decisionAt;
        this.resolutionType = resolutionType;
        this.resolutionNotes = resolutionNotes;
        this.cancellationReason = cancellationReason;
        this.serviceNotes = serviceNotes;
        this.statusHistory = statusHistory;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getWarrantyId() {
        return this.warrantyId;
    }

    public void setWarrantyId(String warrantyId) {
        this.warrantyId = warrantyId;
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

    public String getCustomerName() {
        return this.customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return this.customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getProductName() {
        return this.productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getSerialNumber() {
        return this.serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getIssueDescription() {
        return this.issueDescription;
    }

    public void setIssueDescription(String issueDescription) {
        this.issueDescription = issueDescription;
    }

    public List<String> getEvidenceReferences() {
        return this.evidenceReferences;
    }

    public void setEvidenceReferences(List<String> evidenceReferences) {
        this.evidenceReferences = evidenceReferences;
    }

    public ClaimStatus getCurrentStatus() {
        return this.currentStatus;
    }

    public void setCurrentStatus(ClaimStatus currentStatus) {
        this.currentStatus = currentStatus;
    }

    public String getDecisionReason() {
        return this.decisionReason;
    }

    public void setDecisionReason(String decisionReason) {
        this.decisionReason = decisionReason;
    }

    public String getDecisionBy() {
        return this.decisionBy;
    }

    public void setDecisionBy(String decisionBy) {
        this.decisionBy = decisionBy;
    }

    public Instant getDecisionAt() {
        return this.decisionAt;
    }

    public void setDecisionAt(Instant decisionAt) {
        this.decisionAt = decisionAt;
    }

    public ResolutionType getResolutionType() {
        return this.resolutionType;
    }

    public void setResolutionType(ResolutionType resolutionType) {
        this.resolutionType = resolutionType;
    }

    public String getResolutionNotes() {
        return this.resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public String getCancellationReason() {
        return this.cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public Integer getCustomerRating() {
        return this.customerRating;
    }

    public void setCustomerRating(Integer customerRating) {
        this.customerRating = customerRating;
    }

    public String getCustomerFeedback() {
        return this.customerFeedback;
    }

    public void setCustomerFeedback(String customerFeedback) {
        this.customerFeedback = customerFeedback;
    }

    public Instant getFeedbackSubmittedAt() {
        return this.feedbackSubmittedAt;
    }

    public void setFeedbackSubmittedAt(Instant feedbackSubmittedAt) {
        this.feedbackSubmittedAt = feedbackSubmittedAt;
    }

    public List<Claim.ServiceNote> getServiceNotes() {
        return this.serviceNotes;
    }

    public void setServiceNotes(List<Claim.ServiceNote> serviceNotes) {
        this.serviceNotes = serviceNotes;
    }

    public List<ClaimStatusHistoryResponse> getStatusHistory() {
        return this.statusHistory;
    }

    public void setStatusHistory(List<ClaimStatusHistoryResponse> statusHistory) {
        this.statusHistory = statusHistory;
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
        private String warrantyId;
        private String purchaseId;
        private String retailerId;
        private String retailerBusinessName;
        private String customerId;
        private String customerName;
        private String customerEmail;
        private String productName;
        private String serialNumber;
        private String issueDescription;
        private List<String> evidenceReferences;
        private ClaimStatus currentStatus;
        private String decisionReason;
        private String decisionBy;
        private Instant decisionAt;
        private ResolutionType resolutionType;
        private String resolutionNotes;
        private String cancellationReason;
        private Integer customerRating;
        private String customerFeedback;
        private Instant feedbackSubmittedAt;
        private List<Claim.ServiceNote> serviceNotes;
        private List<ClaimStatusHistoryResponse> statusHistory;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder() {}

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder warrantyId(String warrantyId) {
            this.warrantyId = warrantyId;
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

        public Builder customerName(String customerName) {
            this.customerName = customerName;
            return this;
        }

        public Builder customerEmail(String customerEmail) {
            this.customerEmail = customerEmail;
            return this;
        }

        public Builder productName(String productName) {
            this.productName = productName;
            return this;
        }

        public Builder serialNumber(String serialNumber) {
            this.serialNumber = serialNumber;
            return this;
        }

        public Builder issueDescription(String issueDescription) {
            this.issueDescription = issueDescription;
            return this;
        }

        public Builder evidenceReferences(List<String> evidenceReferences) {
            this.evidenceReferences = evidenceReferences;
            return this;
        }

        public Builder currentStatus(ClaimStatus currentStatus) {
            this.currentStatus = currentStatus;
            return this;
        }

        public Builder decisionReason(String decisionReason) {
            this.decisionReason = decisionReason;
            return this;
        }

        public Builder decisionBy(String decisionBy) {
            this.decisionBy = decisionBy;
            return this;
        }

        public Builder decisionAt(Instant decisionAt) {
            this.decisionAt = decisionAt;
            return this;
        }

        public Builder resolutionType(ResolutionType resolutionType) {
            this.resolutionType = resolutionType;
            return this;
        }

        public Builder resolutionNotes(String resolutionNotes) {
            this.resolutionNotes = resolutionNotes;
            return this;
        }

        public Builder cancellationReason(String cancellationReason) {
            this.cancellationReason = cancellationReason;
            return this;
        }

        public Builder customerRating(Integer customerRating) {
            this.customerRating = customerRating;
            return this;
        }

        public Builder customerFeedback(String customerFeedback) {
            this.customerFeedback = customerFeedback;
            return this;
        }

        public Builder feedbackSubmittedAt(Instant feedbackSubmittedAt) {
            this.feedbackSubmittedAt = feedbackSubmittedAt;
            return this;
        }

        public Builder serviceNotes(List<Claim.ServiceNote> serviceNotes) {
            this.serviceNotes = serviceNotes;
            return this;
        }

        public Builder statusHistory(List<ClaimStatusHistoryResponse> statusHistory) {
            this.statusHistory = statusHistory;
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

        public ClaimResponse build() {
            ClaimResponse response = new ClaimResponse(this.id, this.warrantyId, this.purchaseId, this.retailerId, this.retailerBusinessName, this.customerId, this.customerName, this.customerEmail, this.productName, this.issueDescription, this.evidenceReferences, this.currentStatus, this.decisionReason, this.decisionBy, this.decisionAt, this.resolutionType, this.resolutionNotes, this.cancellationReason, this.serviceNotes, this.statusHistory, this.createdAt, this.updatedAt);
            response.setSerialNumber(this.serialNumber);
            response.setCustomerRating(this.customerRating);
            response.setCustomerFeedback(this.customerFeedback);
            response.setFeedbackSubmittedAt(this.feedbackSubmittedAt);
            return response;
        }
    }

}
