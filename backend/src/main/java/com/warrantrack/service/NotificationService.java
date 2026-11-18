package com.warrantrack.service;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.notification.NotificationResponse;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.exception.UnauthorizedException;
import com.warrantrack.model.Notification;
import com.warrantrack.model.enums.NotificationType;
import com.warrantrack.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);


    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public void sendNotification(String userId, NotificationType type, String message, String relatedEntityId, String entityType) {
        try {
            Notification notification = Notification.builder()
                    .userId(userId)
                    .type(type)
                    .message(message)
                    .relatedEntityId(relatedEntityId)
                    .entityType(entityType)
                    .isRead(false)
                    .createdAt(Instant.now())
                    .build();
            notificationRepository.save(notification);
            log.info("Notification sent to {}: {}", userId, message);
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
        }
    }

    public PagedResponse<NotificationResponse> getUserNotifications(String userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        List<NotificationResponse> responses = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PagedResponse.<NotificationResponse>builder()
                .content(responses)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new UnauthorizedException("Cannot modify notifications of another user");
        }

        notification.setIsRead(true);
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, Pageable.unpaged()).getContent();
        unread.forEach(n -> {
            n.setIsRead(true);
            n.setRead(true);
        });
        notificationRepository.saveAll(unread);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .type(n.getType())
                .message(n.getMessage())
                .relatedEntityId(n.getRelatedEntityId())
                .entityType(n.getEntityType())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}

