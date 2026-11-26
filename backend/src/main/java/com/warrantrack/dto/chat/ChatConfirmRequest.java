package com.warrantrack.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChatConfirmRequest {
    @NotBlank
    @Size(max = 36)
    private String actionId;

    public String getActionId() { return actionId; }
    public void setActionId(String actionId) { this.actionId = actionId; }
}
