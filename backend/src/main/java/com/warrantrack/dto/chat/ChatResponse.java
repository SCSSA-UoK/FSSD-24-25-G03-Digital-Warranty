package com.warrantrack.dto.chat;

import java.util.List;

public class ChatResponse {
    private String message;
    private ChatActionDto pendingAction;
    private List<ChatActionDto> navigationActions;

    public ChatResponse() {}
    public ChatResponse(String message, ChatActionDto pendingAction, List<ChatActionDto> navigationActions) {
        this.message = message;
        this.pendingAction = pendingAction;
        this.navigationActions = navigationActions;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public ChatActionDto getPendingAction() { return pendingAction; }
    public void setPendingAction(ChatActionDto pendingAction) { this.pendingAction = pendingAction; }
    public List<ChatActionDto> getNavigationActions() { return navigationActions; }
    public void setNavigationActions(List<ChatActionDto> navigationActions) { this.navigationActions = navigationActions; }
}
