package com.warrantrack.dto.claim;

import com.warrantrack.model.enums.ClaimStatus;
import com.warrantrack.model.enums.ResolutionType;
import java.time.Instant;

public class ClaimStatusHistoryResponse {
    private String id;
    private String claimId;
    private ClaimStatus previousStatus;
    private ClaimStatus newStatus;
    private String changedBy;
    private Instant changedAt;
    private String note;

    public ClaimStatusHistoryResponse() {
    }

    public ClaimStatusHistoryResponse(String id, String claimId, ClaimStatus previousStatus, ClaimStatus newStatus,
            String changedBy, Instant changedAt, String note) {
        this.id = id;
        this.claimId = claimId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.changedAt = changedAt;
        this.note = note;
    }

    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClaimId() {
        return this.claimId;
    }

    public void setClaimId(String claimId) {
        this.claimId = claimId;
    }

    public ClaimStatus getPreviousStatus() {
        return this.previousStatus;
    }

    public void setPreviousStatus(ClaimStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public ClaimStatus getNewStatus() {
        return this.newStatus;
    }

    public void setNewStatus(ClaimStatus newStatus) {
        this.newStatus = newStatus;
    }

    public String getChangedBy() {
        return this.changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public Instant getChangedAt() {
        return this.changedAt;
    }

    public void setChangedAt(Instant changedAt) {
        this.changedAt = changedAt;
    }

    public String getNote() {
        return this.note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String claimId;
        private ClaimStatus previousStatus;
        private ClaimStatus newStatus;
        private String changedBy;
        private Instant changedAt;
        private String note;

        public Builder() {
        }

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder claimId(String claimId) {
            this.claimId = claimId;
            return this;
        }

        public Builder previousStatus(ClaimStatus previousStatus) {
            this.previousStatus = previousStatus;
            return this;
        }

        public Builder newStatus(ClaimStatus newStatus) {
            this.newStatus = newStatus;
            return this;
        }

        public Builder changedBy(String changedBy) {
            this.changedBy = changedBy;
            return this;
        }

        public Builder changedAt(Instant changedAt) {
            this.changedAt = changedAt;
            return this;
        }

        public Builder note(String note) {
            this.note = note;
            return this;
        }

        public ClaimStatusHistoryResponse build() {
            return new ClaimStatusHistoryResponse(this.id, this.claimId, this.previousStatus, this.newStatus,
                    this.changedBy, this.changedAt, this.note);
        }
    }

}
