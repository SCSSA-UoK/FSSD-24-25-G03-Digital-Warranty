package com.warrantrack.dto.auth;

public class VerifyResetOtpResponse {

    private String resetToken;
    private String message;

    public VerifyResetOtpResponse() {
    }

    public VerifyResetOtpResponse(String resetToken, String message) {
        this.resetToken = resetToken;
        this.message = message;
    }

    public String getResetToken() {
        return this.resetToken;
    }

    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }

    public String getMessage() {
        return this.message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
