package com.warrantrack.dto.claim;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ClaimFeedbackRequest {

    @NotNull(message = "Rating is required (1-5)")
    @Min(value = 1, message = "Rating must be at least 1 star")
    @Max(value = 5, message = "Rating cannot exceed 5 stars")
    private Integer rating;

    @Size(max = 1000, message = "Feedback cannot exceed 1000 characters")
    private String feedback;

    public ClaimFeedbackRequest() {}

    public ClaimFeedbackRequest(Integer rating, String feedback) {
        this.rating = rating;
        this.feedback = feedback;
    }

    public Integer getRating() {
        return this.rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getFeedback() {
        return this.feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}

