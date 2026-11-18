package com.warrantrack.dto.claim;

import jakarta.validation.constraints.NotBlank;
public class CompleteClaimRequest {
    @NotBlank(message = "Final resolution notes are required")
    private String resolutionNotes;


    public CompleteClaimRequest() {
    }

    public String getResolutionNotes() {
        return this.resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

}
