package com.warrantrack.dto.auth;

import com.warrantrack.model.enums.AccountStatus;
import com.warrantrack.model.enums.Role;
import java.time.Instant;

public class UserResponse {
    private String id;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private boolean emailVerified;
    private AccountStatus accountStatus;
    private String statusReason;
    private Instant statusChangedAt;
    private String statusChangedBy;
    private Long warrantiesCount;
    private Long claimsCount;
    private Instant createdAt;

    public UserResponse() {
    }

    public UserResponse(String id, String name, String email, String phone, Role role, boolean emailVerified,
            AccountStatus accountStatus, String statusReason, Instant statusChangedAt, String statusChangedBy,
            Long warrantiesCount, Long claimsCount, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.emailVerified = emailVerified;
        this.accountStatus = accountStatus;
        this.statusReason = statusReason;
        this.statusChangedAt = statusChangedAt;
        this.statusChangedBy = statusChangedBy;
        this.warrantiesCount = warrantiesCount;
        this.claimsCount = claimsCount;
        this.createdAt = createdAt;
    }

    public UserResponse(String id, String name, String email, String phone, Role role, boolean emailVerified,
            AccountStatus accountStatus, Instant createdAt) {
        this(id, name, email, phone, role, emailVerified, accountStatus, null, null, null, null, null, createdAt);
    }

    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getPhone() {
        return this.phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
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

    public Instant getStatusChangedAt() {
        return this.statusChangedAt;
    }

    public void setStatusChangedAt(Instant statusChangedAt) {
        this.statusChangedAt = statusChangedAt;
    }

    public String getStatusChangedBy() {
        return this.statusChangedBy;
    }

    public void setStatusChangedBy(String statusChangedBy) {
        this.statusChangedBy = statusChangedBy;
    }

    public Long getWarrantiesCount() {
        return this.warrantiesCount;
    }

    public void setWarrantiesCount(Long warrantiesCount) {
        this.warrantiesCount = warrantiesCount;
    }

    public Long getClaimsCount() {
        return this.claimsCount;
    }

    public void setClaimsCount(Long claimsCount) {
        this.claimsCount = claimsCount;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String name;
        private String email;
        private String phone;
        private Role role;
        private boolean emailVerified;
        private AccountStatus accountStatus;
        private String statusReason;
        private Instant statusChangedAt;
        private String statusChangedBy;
        private Long warrantiesCount;
        private Long claimsCount;
        private Instant createdAt;

        public Builder() {}

        public Builder id(String id) {
            this.id = id;
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

        public Builder phone(String phone) {
            this.phone = phone;
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

        public Builder accountStatus(AccountStatus accountStatus) {
            this.accountStatus = accountStatus;
            return this;
        }

        public Builder statusReason(String statusReason) {
            this.statusReason = statusReason;
            return this;
        }

        public Builder statusChangedAt(Instant statusChangedAt) {
            this.statusChangedAt = statusChangedAt;
            return this;
        }

        public Builder statusChangedBy(String statusChangedBy) {
            this.statusChangedBy = statusChangedBy;
            return this;
        }

        public Builder warrantiesCount(Long warrantiesCount) {
            this.warrantiesCount = warrantiesCount;
            return this;
        }

        public Builder claimsCount(Long claimsCount) {
            this.claimsCount = claimsCount;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public UserResponse build() {
            return new UserResponse(this.id, this.name, this.email, this.phone, this.role, this.emailVerified,
                    this.accountStatus, this.statusReason, this.statusChangedAt, this.statusChangedBy,
                    this.warrantiesCount, this.claimsCount, this.createdAt);
        }
    }
}
