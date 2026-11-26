package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.chat.ChatConfirmRequest;
import com.warrantrack.dto.chat.ChatRequest;
import com.warrantrack.dto.chat.ChatResponse;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.ChatAgentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatAgentService chatAgentService;

    public ChatController(ChatAgentService chatAgentService) {
        this.chatAgentService = chatAgentService;
    }

    @PostMapping("/message")
    public ResponseEntity<ApiResponse<ChatResponse>> message(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChatRequest request) {
        ChatResponse response = chatAgentService.chat(principal, request.getMessage(), request.getHistory());
        return ResponseEntity.ok(ApiResponse.success("Chat response created", response));
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<ChatResponse>> confirm(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChatConfirmRequest request) {
        ChatResponse response = chatAgentService.confirm(principal, request.getActionId());
        return ResponseEntity.ok(ApiResponse.success("Action confirmed", response));
    }

    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<String>> cancel(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChatConfirmRequest request) {
        chatAgentService.cancel(principal, request.getActionId());
        return ResponseEntity.ok(ApiResponse.success("Action cancelled", null));
    }
}
