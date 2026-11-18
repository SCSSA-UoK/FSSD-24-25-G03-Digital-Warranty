package com.warrantrack.dto.claim;

import com.warrantrack.model.enums.ResolutionType;
import jakarta.validation.constraints.NotNull;

public class ClaimDecisionRequest {
    @NotNull(message = "Decision (approved/rejected) is required")
    private Boolean approved;

    private ResolutionType resolutionType;

    private String reason;

    public ClaimDecisionRequest() {}

    public ClaimDecisionRequest(Boolean approved, ResolutionType resolutionType, String reason) {
        this.approved = approved;
        this.resolutionType = resolutionType;
        this.reason = reason;
    }

    public Boolean getApproved() {
        return this.approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }

    public ResolutionType getResolutionType() {
        return this.resolutionType;
    }

    public void setResolutionType(ResolutionType resolutionType) {
        this.resolutionType = resolutionType;
    }

    public String getReason() {
        return this.reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
