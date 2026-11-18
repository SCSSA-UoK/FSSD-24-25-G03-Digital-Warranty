package com.warrantrack.dto.claim;

import jakarta.validation.constraints.NotBlank;
public class ClaimCancelRequest {
    @NotBlank(message = "Cancellation reason is required")
    private String reason;


    public ClaimCancelRequest() {
    }

    public String getReason() {
        return this.reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

}
