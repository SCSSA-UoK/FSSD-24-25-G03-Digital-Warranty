package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.notification.NotificationResponse;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.NotificationService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUserNotifications(principal.getId(), pageable)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.getUnreadCount(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<String>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        notificationService.markAsRead(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }
}

