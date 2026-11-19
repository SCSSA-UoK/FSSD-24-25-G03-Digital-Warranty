package com.warrantrack.dto.linking;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyAltEmailOtpRequest {

    @NotBlank(message = "Email address is required")
    @Email(message = "Please enter a valid email address")
    private String email;

    @NotBlank(message = "Verification code is required")
    @Pattern(regexp = "^\\d{6}$", message = "Verification code must be 6 digits")
    private String otp;

    private boolean saveAsSecondary = true;

    public VerifyAltEmailOtpRequest() {
    }

    public VerifyAltEmailOtpRequest(String email, String otp, boolean saveAsSecondary) {
        this.email = email;
        this.otp = otp;
        this.saveAsSecondary = saveAsSecondary;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public boolean isSaveAsSecondary() {
        return saveAsSecondary;
    }

    public void setSaveAsSecondary(boolean saveAsSecondary) {
        this.saveAsSecondary = saveAsSecondary;
    }
}
