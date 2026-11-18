package com.warrantrack.dto.auth;

import com.warrantrack.model.enums.AccountStatus;
import com.warrantrack.model.enums.ApprovalStatus;
import com.warrantrack.model.enums.Role;

public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private String userId;
    private String name;
    private String email;
    private Role role;
    private boolean emailVerified;
    private String retailerId;
    private ApprovalStatus retailerApprovalStatus;
    private AccountStatus accountStatus;
    private String statusReason;

    public AuthResponse() {
    }

    public AuthResponse(String token, String tokenType, String userId, String name, String email, Role role,
            boolean emailVerified, String retailerId, ApprovalStatus retailerApprovalStatus,
            AccountStatus accountStatus, String statusReason) {
        this.token = token;
        this.tokenType = tokenType;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.emailVerified = emailVerified;
        this.retailerId = retailerId;
        this.retailerApprovalStatus = retailerApprovalStatus;
        this.accountStatus = accountStatus;
        this.statusReason = statusReason;
    }

    public AuthResponse(String token, String tokenType, String userId, String name, String email, Role role,
            boolean emailVerified, String retailerId, ApprovalStatus retailerApprovalStatus) {
        this(token, tokenType, userId, name, email, role, emailVerified, retailerId, retailerApprovalStatus, AccountStatus.ACTIVE, null);
    }

    public String getToken() {
        return this.token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return this.tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getUserId() {
        return this.userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return this.role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isEmailVerified() {
        return this.emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getRetailerId() {
        return this.retailerId;
    }

    public void setRetailerId(String retailerId) {
        this.retailerId = retailerId;
    }

    public ApprovalStatus getRetailerApprovalStatus() {
        return this.retailerApprovalStatus;
    }

    public void setRetailerApprovalStatus(ApprovalStatus retailerApprovalStatus) {
        this.retailerApprovalStatus = retailerApprovalStatus;
    }

    public AccountStatus getAccountStatus() {
        return this.accountStatus;
    }

    public void setAccountStatus(AccountStatus accountStatus) {
        this.accountStatus = accountStatus;
    }

    public String getStatusReason() {
        return this.statusReason;
    }

    public void setStatusReason(String statusReason) {
        this.statusReason = statusReason;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String token;
        private String tokenType = "Bearer";
        private String userId;
        private String name;
        private String email;
        private Role role;
        private boolean emailVerified;
        private String retailerId;
        private ApprovalStatus retailerApprovalStatus;
        private AccountStatus accountStatus = AccountStatus.ACTIVE;
        private String statusReason;

        public Builder() {
        }

        public Builder token(String token) {
            this.token = token;
            return this;
        }

        public Builder tokenType(String tokenType) {
            this.tokenType = tokenType;
            return this;
        }

        public Builder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder role(Role role) {
            this.role = role;
            return this;
        }

        public Builder emailVerified(boolean emailVerified) {
            this.emailVerified = emailVerified;
            return this;
        }

        public Builder retailerId(String retailerId) {
            this.retailerId = retailerId;
            return this;
        }

        public Builder retailerApprovalStatus(ApprovalStatus retailerApprovalStatus) {
            this.retailerApprovalStatus = retailerApprovalStatus;
            return this;
        }

        public Builder accountStatus(AccountStatus accountStatus) {
            this.accountStatus = accountStatus;
            return this;
        }

        public Builder statusReason(String statusReason) {
            this.statusReason = statusReason;
            return this;
        }

        public AuthResponse build() {
            return new AuthResponse(this.token, this.tokenType, this.userId, this.name, this.email, this.role,
                    this.emailVerified, this.retailerId, this.retailerApprovalStatus,
                    this.accountStatus, this.statusReason);
        }
    }
}
