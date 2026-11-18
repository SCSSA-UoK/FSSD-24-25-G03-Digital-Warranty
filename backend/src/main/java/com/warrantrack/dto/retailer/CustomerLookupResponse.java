package com.warrantrack.dto.retailer;

public class CustomerLookupResponse {

    private String id;
    private String name;
    private String email;
    private String phone;
    private boolean isRegistered;
    private boolean isEmailVerified;
    private String accountStatus; // ACTIVE, INACTIVE, SUSPENDED, UNREGISTERED
    private long totalWarranties;
    private long previousPurchasesWithRetailer;
    private String lastPurchaseDate;
    private String matchType; // EXACT_PHONE, EXACT_EMAIL, CONTACT_MATCH, NAME_MATCH, PREVIOUS_CUSTOMER

    public CustomerLookupResponse() {
    }

    public CustomerLookupResponse(String id, String name, String email, String phone, boolean isRegistered,
                                  boolean isEmailVerified, String accountStatus, long totalWarranties,
                                  long previousPurchasesWithRetailer, String lastPurchaseDate, String matchType) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.isRegistered = isRegistered;
        this.isEmailVerified = isEmailVerified;
        this.accountStatus = accountStatus;
        this.totalWarranties = totalWarranties;
        this.previousPurchasesWithRetailer = previousPurchasesWithRetailer;
        this.lastPurchaseDate = lastPurchaseDate;
        this.matchType = matchType;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public boolean isRegistered() {
        return isRegistered;
    }

    public void setRegistered(boolean registered) {
        isRegistered = registered;
    }

    public boolean isEmailVerified() {
        return isEmailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        isEmailVerified = emailVerified;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }

    public long getTotalWarranties() {
        return totalWarranties;
    }

    public void setTotalWarranties(long totalWarranties) {
        this.totalWarranties = totalWarranties;
    }

    public long getPreviousPurchasesWithRetailer() {
        return previousPurchasesWithRetailer;
    }

    public void setPreviousPurchasesWithRetailer(long previousPurchasesWithRetailer) {
        this.previousPurchasesWithRetailer = previousPurchasesWithRetailer;
    }

    public String getLastPurchaseDate() {
        return lastPurchaseDate;
    }

    public void setLastPurchaseDate(String lastPurchaseDate) {
        this.lastPurchaseDate = lastPurchaseDate;
    }

    public String getMatchType() {
        return matchType;
    }

    public void setMatchType(String matchType) {
        this.matchType = matchType;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String name;
        private String email;
        private String phone;
        private boolean isRegistered;
        private boolean isEmailVerified;
        private String accountStatus;
        private long totalWarranties;
        private long previousPurchasesWithRetailer;
        private String lastPurchaseDate;
        private String matchType;

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

        public Builder isRegistered(boolean isRegistered) {
            this.isRegistered = isRegistered;
            return this;
        }

        public Builder isEmailVerified(boolean isEmailVerified) {
            this.isEmailVerified = isEmailVerified;
            return this;
        }

        public Builder accountStatus(String accountStatus) {
            this.accountStatus = accountStatus;
            return this;
        }

        public Builder totalWarranties(long totalWarranties) {
            this.totalWarranties = totalWarranties;
            return this;
        }

        public Builder previousPurchasesWithRetailer(long previousPurchasesWithRetailer) {
            this.previousPurchasesWithRetailer = previousPurchasesWithRetailer;
            return this;
        }

        public Builder lastPurchaseDate(String lastPurchaseDate) {
            this.lastPurchaseDate = lastPurchaseDate;
            return this;
        }

        public Builder matchType(String matchType) {
            this.matchType = matchType;
            return this;
        }

        public CustomerLookupResponse build() {
            return new CustomerLookupResponse(
                    id, name, email, phone, isRegistered, isEmailVerified, accountStatus,
                    totalWarranties, previousPurchasesWithRetailer, lastPurchaseDate, matchType
            );
        }
    }
}
