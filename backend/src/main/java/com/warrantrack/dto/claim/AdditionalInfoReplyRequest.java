package com.warrantrack.dto.claim;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class AdditionalInfoReplyRequest {
    @NotBlank(message = "Response details are required")
    private String response;

    private List<String> additionalEvidence;


    public AdditionalInfoReplyRequest() {
    }

    public String getResponse() {
        return this.response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public List<String> getAdditionalEvidence() {
        return this.additionalEvidence;
    }

    public void setAdditionalEvidence(List<String> additionalEvidence) {
        this.additionalEvidence = additionalEvidence;
    }

}
