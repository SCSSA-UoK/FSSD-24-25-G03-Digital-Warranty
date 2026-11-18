package com.warrantrack.dto.retailer;

import com.warrantrack.model.enums.ApprovalStatus;
import jakarta.validation.constraints.NotNull;
public class RetailerStatusUpdateRequest {
    @NotNull(message = "Approval status is required")
    private ApprovalStatus status;

    private String reason;


    public RetailerStatusUpdateRequest() {
    }

    public ApprovalStatus getStatus() {
        return this.status;
    }

    public void setStatus(ApprovalStatus status) {
        this.status = status;
    }

    public String getReason() {
        return this.reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

}
