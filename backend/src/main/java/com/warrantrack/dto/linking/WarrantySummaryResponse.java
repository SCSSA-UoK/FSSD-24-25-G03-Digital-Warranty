package com.warrantrack.dto.linking;

import java.time.LocalDate;

public class WarrantySummaryResponse {

    private String id;
    private String status;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private int duration;
    private String unit;
    private String qrToken;

    public WarrantySummaryResponse() {
    }

    public WarrantySummaryResponse(String id, String status, LocalDate startDate, LocalDate expiryDate, int duration, String unit, String qrToken) {
        this.id = id;
        this.status = status;
        this.startDate = startDate;
        this.expiryDate = expiryDate;
        this.duration = duration;
        this.unit = unit;
        this.qrToken = qrToken;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public int getDuration() {
        return duration;
    }

    public void setDuration(int duration) {
        this.duration = duration;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }
}
