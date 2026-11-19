package com.warrantrack.model;

import com.warrantrack.model.enums.AccountStatus;
import com.warrantrack.model.enums.Role;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    private String email;

    @Indexed(unique = true, sparse = true)
    private String emailNormalized;

    private String phone;

    private String passwordHash;

    private Role role;

    private boolean emailVerified = false;

    private AccountStatus accountStatus = AccountStatus.ACTIVE;
    private String statusReason;
    private Instant statusChangedAt;
    private String statusChangedBy;

    // OTP fields
    private String otpHash;
    private Instant otpExpiresAt;
    private int otpAttempts = 0;
    private Instant lastOtpSentAt;

    // Password reset fields
    private String resetToken;
    private Instant resetTokenExpiresAt;
    private String passwordResetOtpHash;
    private Instant passwordResetOtpExpiresAt;
    private int passwordResetOtpAttempts = 0;
    private Instant lastPasswordResetOtpSentAt;
    private boolean passwordResetVerified = false;

    // Verified secondary emails for purchase matching
    private java.util.List<SecondaryEmail> secondaryEmails = new java.util.ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;


    public User() {
    }

    public User(String id, String name, String email, String emailNormalized, String phone, String passwordHash, Role role, boolean emailVerified, AccountStatus accountStatus, String otpHash, Instant otpExpiresAt, int otpAttempts, Instant lastOtpSentAt, String resetToken, Instant resetTokenExpiresAt, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.emailNormalized = emailNormalized;
        this.phone = phone;
        this.passwordHash = passwordHash;
        this.role = role;
        this.emailVerified = emailVerified;
        this.accountStatus = accountStatus;
        this.otpHash = otpHash;
        this.otpExpiresAt = otpExpiresAt;
        this.otpAttempts = otpAttempts;
        this.lastOtpSentAt = lastOtpSentAt;
        this.resetToken = resetToken;
        this.resetTokenExpiresAt = resetTokenExpiresAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public String getEmailNormalized() {
        return this.emailNormalized;
    }

    public void setEmailNormalized(String emailNormalized) {
        this.emailNormalized = emailNormalized;
    }

    public String getPhone() {
        return this.phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPasswordHash() {
        return this.passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
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

    public String getOtpHash() {
        return this.otpHash;
    }

    public void setOtpHash(String otpHash) {
        this.otpHash = otpHash;
    }

    public Instant getOtpExpiresAt() {
        return this.otpExpiresAt;
    }

    public void setOtpExpiresAt(Instant otpExpiresAt) {
        this.otpExpiresAt = otpExpiresAt;
    }

    public int getOtpAttempts() {
        return this.otpAttempts;
    }

    public void setOtpAttempts(int otpAttempts) {
        this.otpAttempts = otpAttempts;
    }

    public Instant getLastOtpSentAt() {
        return this.lastOtpSentAt;
    }

    public void setLastOtpSentAt(Instant lastOtpSentAt) {
        this.lastOtpSentAt = lastOtpSentAt;
    }

    public String getResetToken() {
        return this.resetToken;
    }

    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }

    public Instant getResetTokenExpiresAt() {
        return this.resetTokenExpiresAt;
    }

    public void setResetTokenExpiresAt(Instant resetTokenExpiresAt) {
        this.resetTokenExpiresAt = resetTokenExpiresAt;
    }

    public String getPasswordResetOtpHash() {
        return this.passwordResetOtpHash;
    }

    public void setPasswordResetOtpHash(String passwordResetOtpHash) {
        this.passwordResetOtpHash = passwordResetOtpHash;
    }

    public Instant getPasswordResetOtpExpiresAt() {
        return this.passwordResetOtpExpiresAt;
    }

    public void setPasswordResetOtpExpiresAt(Instant passwordResetOtpExpiresAt) {
        this.passwordResetOtpExpiresAt = passwordResetOtpExpiresAt;
    }

    public int getPasswordResetOtpAttempts() {
        return this.passwordResetOtpAttempts;
    }

    public void setPasswordResetOtpAttempts(int passwordResetOtpAttempts) {
        this.passwordResetOtpAttempts = passwordResetOtpAttempts;
    }

    public Instant getLastPasswordResetOtpSentAt() {
        return this.lastPasswordResetOtpSentAt;
    }

    public void setLastPasswordResetOtpSentAt(Instant lastPasswordResetOtpSentAt) {
        this.lastPasswordResetOtpSentAt = lastPasswordResetOtpSentAt;
    }

    public boolean isPasswordResetVerified() {
        return this.passwordResetVerified;
    }

    public void setPasswordResetVerified(boolean passwordResetVerified) {
        this.passwordResetVerified = passwordResetVerified;
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

    public java.util.List<SecondaryEmail> getSecondaryEmails() {
        if (this.secondaryEmails == null) {
            this.secondaryEmails = new java.util.ArrayList<>();
        }
        return this.secondaryEmails;
    }

    public void setSecondaryEmails(java.util.List<SecondaryEmail> secondaryEmails) {
        this.secondaryEmails = secondaryEmails != null ? secondaryEmails : new java.util.ArrayList<>();
    }

    public boolean hasSecondaryEmail(String emailNormalized) {
        if (emailNormalized == null || this.secondaryEmails == null) {
            return false;
        }
        return this.secondaryEmails.stream()
                .anyMatch(s -> emailNormalized.equalsIgnoreCase(s.getEmailNormalized()));
    }

    public void addSecondaryEmail(String email, String emailNormalized) {
        if (emailNormalized == null) return;
        if (this.secondaryEmails == null) {
            this.secondaryEmails = new java.util.ArrayList<>();
        }
        if (!hasSecondaryEmail(emailNormalized)) {
            this.secondaryEmails.add(new SecondaryEmail(email, emailNormalized, Instant.now()));
        }
    }

    public boolean removeSecondaryEmail(String emailNormalized) {
        if (emailNormalized == null || this.secondaryEmails == null) {
            return false;
        }
        return this.secondaryEmails.removeIf(s -> emailNormalized.equalsIgnoreCase(s.getEmailNormalized()));
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String name;
        private String email;
        private String emailNormalized;
        private String phone;
        private String passwordHash;
        private Role role;
        private boolean emailVerified = false;
        private AccountStatus accountStatus = AccountStatus.ACTIVE;
    private String statusReason;
    private Instant statusChangedAt;
    private String statusChangedBy;
        private String otpHash;
        private Instant otpExpiresAt;
        private int otpAttempts = 0;
        private Instant lastOtpSentAt;
        private String resetToken;
        private Instant resetTokenExpiresAt;
        private Instant createdAt;
        private Instant updatedAt;

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

        public Builder emailNormalized(String emailNormalized) {
            this.emailNormalized = emailNormalized;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder passwordHash(String passwordHash) {
            this.passwordHash = passwordHash;
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

        public Builder otpHash(String otpHash) {
            this.otpHash = otpHash;
            return this;
        }

        public Builder otpExpiresAt(Instant otpExpiresAt) {
            this.otpExpiresAt = otpExpiresAt;
            return this;
        }

        public Builder otpAttempts(int otpAttempts) {
            this.otpAttempts = otpAttempts;
            return this;
        }

        public Builder lastOtpSentAt(Instant lastOtpSentAt) {
            this.lastOtpSentAt = lastOtpSentAt;
            return this;
        }

        public Builder resetToken(String resetToken) {
            this.resetToken = resetToken;
            return this;
        }

        public Builder resetTokenExpiresAt(Instant resetTokenExpiresAt) {
            this.resetTokenExpiresAt = resetTokenExpiresAt;
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

        public User build() {
            User user = new User(this.id, this.name, this.email, this.emailNormalized, this.phone, this.passwordHash, this.role, this.emailVerified, this.accountStatus, this.otpHash, this.otpExpiresAt, this.otpAttempts, this.lastOtpSentAt, this.resetToken, this.resetTokenExpiresAt, this.createdAt, this.updatedAt);
            user.setStatusReason(this.statusReason);
            user.setStatusChangedAt(this.statusChangedAt);
            user.setStatusChangedBy(this.statusChangedBy);
            return user;
        }
    }

}
