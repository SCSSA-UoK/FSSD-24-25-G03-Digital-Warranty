package com.warrantrack.dto.admin;

import com.warrantrack.model.enums.AccountStatus;
import jakarta.validation.constraints.NotNull;

public class CustomerStatusUpdateRequest {
    @NotNull(message = "Account status is required")
    private AccountStatus status;

    private String reason;

    public CustomerStatusUpdateRequest() {
    }

    public CustomerStatusUpdateRequest(AccountStatus status, String reason) {
        this.status = status;
        this.reason = reason;
    }

    public AccountStatus getStatus() {
        return this.status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public String getReason() {
        return this.reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
