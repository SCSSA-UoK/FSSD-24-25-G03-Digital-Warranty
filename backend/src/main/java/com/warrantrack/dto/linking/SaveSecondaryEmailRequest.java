package com.warrantrack.dto.linking;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class SaveSecondaryEmailRequest {

    @NotBlank(message = "Email address is required")
    @Email(message = "Please enter a valid email address")
    private String email;

    private String verificationToken;

    public SaveSecondaryEmailRequest() {
    }

    public SaveSecondaryEmailRequest(String email, String verificationToken) {
        this.email = email;
        this.verificationToken = verificationToken;
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
