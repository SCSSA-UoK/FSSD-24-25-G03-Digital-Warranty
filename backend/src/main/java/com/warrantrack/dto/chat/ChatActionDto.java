package com.warrantrack.dto.chat;

public class ChatActionDto {
    private String id;
    private String label;
    private String summary;
    private String path;

    public ChatActionDto() {}
    public ChatActionDto(String id, String label, String summary, String path) {
        this.id = id;
        this.label = label;
        this.summary = summary;
        this.path = path;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
}
