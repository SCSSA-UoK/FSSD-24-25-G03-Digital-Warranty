package com.warrantrack.dto.linking;

public class AltEmailVerificationResponse {

    private String email;
    private String verificationToken;
    private boolean savedAsSecondary;
    private String message;

    public AltEmailVerificationResponse() {
    }

    public AltEmailVerificationResponse(String email, String verificationToken, boolean savedAsSecondary, String message) {
        this.email = email;
        this.verificationToken = verificationToken;
        this.savedAsSecondary = savedAsSecondary;
        this.message = message;
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

    public boolean isSavedAsSecondary() {
        return savedAsSecondary;
    }

    public void setSavedAsSecondary(boolean savedAsSecondary) {
        this.savedAsSecondary = savedAsSecondary;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
