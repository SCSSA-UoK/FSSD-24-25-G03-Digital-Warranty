package com.warrantrack.dto.linking;

import java.time.Instant;

public class SecondaryEmailDto {

    private String email;
    private Instant verifiedAt;
    private int linkedPurchasesCount;
    private int availablePurchasesCount;

    public SecondaryEmailDto() {
    }

    public SecondaryEmailDto(String email, Instant verifiedAt, int linkedPurchasesCount, int availablePurchasesCount) {
        this.email = email;
        this.verifiedAt = verifiedAt;
        this.linkedPurchasesCount = linkedPurchasesCount;
        this.availablePurchasesCount = availablePurchasesCount;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public int getLinkedPurchasesCount() {
        return linkedPurchasesCount;
    }

    public void setLinkedPurchasesCount(int linkedPurchasesCount) {
        this.linkedPurchasesCount = linkedPurchasesCount;
    }

    public int getAvailablePurchasesCount() {
        return availablePurchasesCount;
    }

    public void setAvailablePurchasesCount(int availablePurchasesCount) {
        this.availablePurchasesCount = availablePurchasesCount;
    }
}
