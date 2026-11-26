package com.warrantrack.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class ChatRequest {
    @NotBlank
    @Size(max = 500)
    private String message;

    @Size(max = 20)
    private List<ChatHistoryItem> history;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public List<ChatHistoryItem> getHistory() { return history; }
    public void setHistory(List<ChatHistoryItem> history) { this.history = history; }
}
