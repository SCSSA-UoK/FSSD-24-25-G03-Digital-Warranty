package com.warrantrack.dto.linking;

public class AltEmailOtpResponse {

    private String email;
    private String message;
    private int cooldownSeconds;
    private int expiryMinutes;

    public AltEmailOtpResponse() {
    }

    public AltEmailOtpResponse(String email, String message, int cooldownSeconds, int expiryMinutes) {
        this.email = email;
        this.message = message;
        this.cooldownSeconds = cooldownSeconds;
        this.expiryMinutes = expiryMinutes;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getCooldownSeconds() {
        return cooldownSeconds;
    }

    public void setCooldownSeconds(int cooldownSeconds) {
        this.cooldownSeconds = cooldownSeconds;
    }

    public int getExpiryMinutes() {
        return expiryMinutes;
    }

    public void setExpiryMinutes(int expiryMinutes) {
        this.expiryMinutes = expiryMinutes;
    }
}
