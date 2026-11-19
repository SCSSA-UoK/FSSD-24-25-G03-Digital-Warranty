package com.warrantrack.model;

import java.time.Instant;

public class SecondaryEmail {

    private String email;
    private String emailNormalized;
    private Instant verifiedAt;

    public SecondaryEmail() {
    }

    public SecondaryEmail(String email, String emailNormalized, Instant verifiedAt) {
        this.email = email;
        this.emailNormalized = emailNormalized;
        this.verifiedAt = verifiedAt;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEmailNormalized() {
        return emailNormalized;
    }

    public void setEmailNormalized(String emailNormalized) {
        this.emailNormalized = emailNormalized;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}
