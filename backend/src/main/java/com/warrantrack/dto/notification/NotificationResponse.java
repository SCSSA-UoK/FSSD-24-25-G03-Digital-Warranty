package com.warrantrack.dto.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.warrantrack.model.enums.NotificationType;
import java.time.Instant;

public class NotificationResponse {
    private String id;
    private String userId;
    private NotificationType type;
    private String message;
    private String relatedEntityId;
    private String entityType;

    @JsonProperty("isRead")
    private boolean isRead;

    private Instant createdAt;


    public NotificationResponse() {
    }

    public NotificationResponse(String id, String userId, NotificationType type, String message, String relatedEntityId, String entityType, boolean isRead, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.message = message;
        this.relatedEntityId = relatedEntityId;
        this.entityType = entityType;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return this.userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public NotificationType getType() {
        return this.type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getMessage() {
        return this.message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRelatedEntityId() {
        return this.relatedEntityId;
    }

    public void setRelatedEntityId(String relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }

    public String getEntityType() {
        return this.entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    @JsonProperty("isRead")
    public boolean isRead() {
        return this.isRead;
    }

    @JsonProperty("isRead")
    public void setIsRead(boolean isRead) {
        this.isRead = isRead;
    }

    @JsonProperty("read")
    public boolean getRead() {
        return this.isRead;
    }

    @JsonProperty("read")
    public void setRead(boolean read) {
        this.isRead = read;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String userId;
        private NotificationType type;
        private String message;
        private String relatedEntityId;
        private String entityType;
        private boolean isRead;
        private Instant createdAt;

        public Builder() {}

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public Builder type(NotificationType type) {
            this.type = type;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder relatedEntityId(String relatedEntityId) {
            this.relatedEntityId = relatedEntityId;
            return this;
        }

        public Builder entityType(String entityType) {
            this.entityType = entityType;
            return this;
        }

        public Builder isRead(boolean isRead) {
            this.isRead = isRead;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public NotificationResponse build() {
            return new NotificationResponse(this.id, this.userId, this.type, this.message, this.relatedEntityId, this.entityType, this.isRead, this.createdAt);
        }
    }

}
