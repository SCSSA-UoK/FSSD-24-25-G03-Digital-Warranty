package com.warrantrack.dto.purchase;

/**
 * Request payload for claiming/linking purchases.
 * OTP verification is redundant for verified accounts and now optional.
 */
public class LinkPurchaseRequest {
    private String otp;

    public LinkPurchaseRequest() {
    }

    public LinkPurchaseRequest(String otp) {
        this.otp = otp;
    }

    public String getOtp() {
        return this.otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
