package com.warrantrack.dto.claim;

import jakarta.validation.constraints.NotBlank;
public class ServiceProgressRequest {
    @NotBlank(message = "Service update note is required")
    private String note;


    public ServiceProgressRequest() {
    }

    public String getNote() {
        return this.note;
    }

    public void setNote(String note) {
        this.note = note;
    }

}
