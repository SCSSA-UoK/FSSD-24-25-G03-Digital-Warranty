package com.warrantrack.dto.linking;

import java.util.ArrayList;
import java.util.List;

public class FindPurchasesResultResponse {

    private String email;
    private boolean isSavedSecondary;
    private int totalCount;
    private int availableCount;
    private int alreadyLinkedCount;
    private int linkedToOtherCount;
    private List<AltPurchaseItemResponse> purchases = new ArrayList<>();

    public FindPurchasesResultResponse() {
    }

    public FindPurchasesResultResponse(String email, boolean isSavedSecondary, int totalCount, int availableCount, int alreadyLinkedCount, int linkedToOtherCount, List<AltPurchaseItemResponse> purchases) {
        this.email = email;
        this.isSavedSecondary = isSavedSecondary;
        this.totalCount = totalCount;
        this.availableCount = availableCount;
        this.alreadyLinkedCount = alreadyLinkedCount;
        this.linkedToOtherCount = linkedToOtherCount;
        this.purchases = purchases != null ? purchases : new ArrayList<>();
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isSavedSecondary() {
        return isSavedSecondary;
    }

    public void setSavedSecondary(boolean savedSecondary) {
        isSavedSecondary = savedSecondary;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }

    public int getAvailableCount() {
        return availableCount;
    }

    public void setAvailableCount(int availableCount) {
        this.availableCount = availableCount;
    }

    public int getAlreadyLinkedCount() {
        return alreadyLinkedCount;
    }

    public void setAlreadyLinkedCount(int alreadyLinkedCount) {
        this.alreadyLinkedCount = alreadyLinkedCount;
    }

    public int getLinkedToOtherCount() {
        return linkedToOtherCount;
    }

    public void setLinkedToOtherCount(int linkedToOtherCount) {
        this.linkedToOtherCount = linkedToOtherCount;
    }

    public List<AltPurchaseItemResponse> getPurchases() {
        return purchases;
    }

    public void setPurchases(List<AltPurchaseItemResponse> purchases) {
        this.purchases = purchases != null ? purchases : new ArrayList<>();
    }
}
