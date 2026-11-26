package com.warrantrack.dto.chat;

public class ChatHistoryItem {
    private String role;
    private String content;

    public ChatHistoryItem() {}
    public ChatHistoryItem(String role, String content) {
        this.role = role;
        this.content = content;
    }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
