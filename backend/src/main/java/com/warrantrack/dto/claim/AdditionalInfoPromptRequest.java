package com.warrantrack.dto.claim;

import jakarta.validation.constraints.NotBlank;
public class AdditionalInfoPromptRequest {
    @NotBlank(message = "Reason or description of required info is mandatory")
    private String reason;


    public AdditionalInfoPromptRequest() {
    }

    public String getReason() {
        return this.reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

}
