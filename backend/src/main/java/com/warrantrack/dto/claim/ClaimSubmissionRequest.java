package com.warrantrack.dto.claim;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class ClaimSubmissionRequest {
    @NotBlank(message = "Warranty ID is required")
    private String warrantyId;

    @NotBlank(message = "Issue description is required")
    private String issueDescription;

    private List<String> evidenceReferences;


    public ClaimSubmissionRequest() {
    }

    public String getWarrantyId() {
        return this.warrantyId;
    }

    public void setWarrantyId(String warrantyId) {
        this.warrantyId = warrantyId;
    }

    public String getIssueDescription() {
        return this.issueDescription;
    }

    public void setIssueDescription(String issueDescription) {
        this.issueDescription = issueDescription;
    }

    public List<String> getEvidenceReferences() {
        return this.evidenceReferences;
    }

    public void setEvidenceReferences(List<String> evidenceReferences) {
        this.evidenceReferences = evidenceReferences;
    }

}
