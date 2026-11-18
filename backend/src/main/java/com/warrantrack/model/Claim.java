package com.warrantrack.model;

import com.warrantrack.model.enums.ClaimStatus;
import com.warrantrack.model.enums.ResolutionType;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "claims")
public class Claim {

    @Id
    private String id;

    private String warrantyId;

    private String purchaseId;

    private String retailerId;

    private String customerId;

    private String issueDescription;

    private List<String> evidenceReferences = new ArrayList<>();

    private ClaimStatus currentStatus = ClaimStatus.SUBMITTED;

    private String decisionReason;

    private String decisionBy;

    private Instant decisionAt;

    private ResolutionType resolutionType;

    private String resolutionNotes;

    private String cancellationReason;

    private String cancelledBy;

    private Instant cancelledAt;

    private Integer customerRating;

    private String customerFeedback;

    private Instant feedbackSubmittedAt;

    private List<ServiceNote> serviceNotes = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public static class ServiceNote {
        private String note;
        private String addedBy;
        private Instant addedAt;

        public ServiceNote() {}

        public ServiceNote(String note, String addedBy, Instant addedAt) {
            this.note = note;
            this.addedBy = addedBy;
            this.addedAt = addedAt;
        }

        public String getNote() { return this.note; }
        public void setNote(String note) { this.note = note; }

        public String getAddedBy() { return this.addedBy; }
        public void setAddedBy(String addedBy) { this.addedBy = addedBy; }

        public Instant getAddedAt() { return this.addedAt; }
        public void setAddedAt(Instant addedAt) { this.addedAt = addedAt; }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private String note;
            private String addedBy;
            private Instant addedAt;

            public Builder() {}
            public Builder note(String note) { this.note = note; return this; }
            public Builder addedBy(String addedBy) { this.addedBy = addedBy; return this; }
            public Builder addedAt(Instant addedAt) { this.addedAt = addedAt; return this; }
            public ServiceNote build() { return new ServiceNote(this.note, this.addedBy, this.addedAt); }
        }
    }

    public Claim() {
    }

    public Claim(String id, String warrantyId, String purchaseId, String retailerId, String customerId,
                 String issueDescription, List<String> evidenceReferences, ClaimStatus currentStatus,
                 String decisionReason, String decisionBy, Instant decisionAt, ResolutionType resolutionType,
                 String resolutionNotes, String cancellationReason, String cancelledBy, Instant cancelledAt,
                 List<ServiceNote> serviceNotes, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.warrantyId = warrantyId;
        this.purchaseId = purchaseId;
        this.retailerId = retailerId;
        this.customerId = customerId;
        this.issueDescription = issueDescription;
        this.evidenceReferences = evidenceReferences != null ? evidenceReferences : new ArrayList<>();
        this.currentStatus = currentStatus != null ? currentStatus : ClaimStatus.SUBMITTED;
        this.decisionReason = decisionReason;
        this.decisionBy = decisionBy;
        this.decisionAt = decisionAt;
        this.resolutionType = resolutionType;
        this.resolutionNotes = resolutionNotes;
        this.cancellationReason = cancellationReason;
        this.cancelledBy = cancelledBy;
        this.cancelledAt = cancelledAt;
        this.serviceNotes = serviceNotes != null ? serviceNotes : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return this.id; }
    public void setId(String id) { this.id = id; }

    public String getWarrantyId() { return this.warrantyId; }
    public void setWarrantyId(String warrantyId) { this.warrantyId = warrantyId; }

    public String getPurchaseId() { return this.purchaseId; }
    public void setPurchaseId(String purchaseId) { this.purchaseId = purchaseId; }

    public String getRetailerId() { return this.retailerId; }
    public void setRetailerId(String retailerId) { this.retailerId = retailerId; }

    public String getCustomerId() { return this.customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getIssueDescription() { return this.issueDescription; }
    public void setIssueDescription(String issueDescription) { this.issueDescription = issueDescription; }

    public List<String> getEvidenceReferences() { return this.evidenceReferences; }
    public void setEvidenceReferences(List<String> evidenceReferences) { this.evidenceReferences = evidenceReferences; }

    public ClaimStatus getCurrentStatus() { return this.currentStatus; }
    public void setCurrentStatus(ClaimStatus currentStatus) { this.currentStatus = currentStatus; }

    public String getDecisionReason() { return this.decisionReason; }
    public void setDecisionReason(String decisionReason) { this.decisionReason = decisionReason; }

    public String getDecisionBy() { return this.decisionBy; }
    public void setDecisionBy(String decisionBy) { this.decisionBy = decisionBy; }

    public Instant getDecisionAt() { return this.decisionAt; }
    public void setDecisionAt(Instant decisionAt) { this.decisionAt = decisionAt; }

    public ResolutionType getResolutionType() { return this.resolutionType; }
    public void setResolutionType(ResolutionType resolutionType) { this.resolutionType = resolutionType; }

    public String getResolutionNotes() { return this.resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public String getCancellationReason() { return this.cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public String getCancelledBy() { return this.cancelledBy; }
    public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }

    public Instant getCancelledAt() { return this.cancelledAt; }
    public void setCancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; }

    public Integer getCustomerRating() { return this.customerRating; }
    public void setCustomerRating(Integer customerRating) { this.customerRating = customerRating; }

    public String getCustomerFeedback() { return this.customerFeedback; }
    public void setCustomerFeedback(String customerFeedback) { this.customerFeedback = customerFeedback; }

    public Instant getFeedbackSubmittedAt() { return this.feedbackSubmittedAt; }
    public void setFeedbackSubmittedAt(Instant feedbackSubmittedAt) { this.feedbackSubmittedAt = feedbackSubmittedAt; }

    public List<ServiceNote> getServiceNotes() { return this.serviceNotes; }
    public void setServiceNotes(List<ServiceNote> serviceNotes) { this.serviceNotes = serviceNotes; }

    public Instant getCreatedAt() { return this.createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return this.updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private String warrantyId;
        private String purchaseId;
        private String retailerId;
        private String customerId;
        private String issueDescription;
        private List<String> evidenceReferences = new ArrayList<>();
        private ClaimStatus currentStatus = ClaimStatus.SUBMITTED;
        private String decisionReason;
        private String decisionBy;
        private Instant decisionAt;
        private ResolutionType resolutionType;
        private String resolutionNotes;
        private String cancellationReason;
        private String cancelledBy;
        private Instant cancelledAt;
        private List<ServiceNote> serviceNotes = new ArrayList<>();
        private Instant createdAt;
        private Instant updatedAt;

        public Builder() {}

        public Builder id(String id) { this.id = id; return this; }
        public Builder warrantyId(String warrantyId) { this.warrantyId = warrantyId; return this; }
        public Builder purchaseId(String purchaseId) { this.purchaseId = purchaseId; return this; }
        public Builder retailerId(String retailerId) { this.retailerId = retailerId; return this; }
        public Builder customerId(String customerId) { this.customerId = customerId; return this; }
        public Builder issueDescription(String issueDescription) { this.issueDescription = issueDescription; return this; }
        public Builder evidenceReferences(List<String> evidenceReferences) { this.evidenceReferences = evidenceReferences; return this; }
        public Builder currentStatus(ClaimStatus currentStatus) { this.currentStatus = currentStatus; return this; }
        public Builder decisionReason(String decisionReason) { this.decisionReason = decisionReason; return this; }
        public Builder decisionBy(String decisionBy) { this.decisionBy = decisionBy; return this; }
        public Builder decisionAt(Instant decisionAt) { this.decisionAt = decisionAt; return this; }
        public Builder resolutionType(ResolutionType resolutionType) { this.resolutionType = resolutionType; return this; }
        public Builder resolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; return this; }
        public Builder cancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; return this; }
        public Builder cancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; return this; }
        public Builder cancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; return this; }
        public Builder serviceNotes(List<ServiceNote> serviceNotes) { this.serviceNotes = serviceNotes; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public Claim build() {
            return new Claim(this.id, this.warrantyId, this.purchaseId, this.retailerId, this.customerId,
                    this.issueDescription, this.evidenceReferences, this.currentStatus, this.decisionReason,
                    this.decisionBy, this.decisionAt, this.resolutionType, this.resolutionNotes,
                    this.cancellationReason, this.cancelledBy, this.cancelledAt, this.serviceNotes,
                    this.createdAt, this.updatedAt);
        }
    }
}
