package com.warrantrack.dto.linking;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LinkAltEmailPurchaseRequest {

    @NotBlank(message = "Purchase ID is required")
    private String purchaseId;

    @NotBlank(message = "Email address is required")
    @Email(message = "Please enter a valid email address")
    private String email;

    private String verificationToken;

    public LinkAltEmailPurchaseRequest() {
    }

    public LinkAltEmailPurchaseRequest(String purchaseId, String email, String verificationToken) {
        this.purchaseId = purchaseId;
        this.email = email;
        this.verificationToken = verificationToken;
    }

    public String getPurchaseId() {
        return purchaseId;
    }

    public void setPurchaseId(String purchaseId) {
        this.purchaseId = purchaseId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getVerificationToken() {
        return verificationToken;
    }

    public void setVerificationToken(String verificationToken) {
        this.verificationToken = verificationToken;
    }
}
