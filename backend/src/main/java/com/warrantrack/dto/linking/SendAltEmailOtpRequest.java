package com.warrantrack.dto.linking;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class SendAltEmailOtpRequest {

    @NotBlank(message = "Email address is required")
    @Email(message = "Please enter a valid email address")
    private String email;

    public SendAltEmailOtpRequest() {
    }

    public SendAltEmailOtpRequest(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
