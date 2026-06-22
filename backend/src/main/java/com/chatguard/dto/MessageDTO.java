package com.chatguard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class MessageDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String channelId;
        private String recipientId;
        private String parentMessageId;

        @NotBlank(message = "Content is required")
        private String content;

        @Builder.Default
        private String contentType = "TEXT";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @NotBlank(message = "Content is required")
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private String id;
        private String channelId;
        private String senderId;
        private String senderName;
        private String senderAvatar;
        private String recipientId;
        private String parentMessageId;
        private String content;
        private String contentType;
        private Boolean sensitivityDetected;
        private String sensitivityType;
        private Boolean protectionTriggered;
        private String protectionType;
        private LocalDateTime editedAt;
        private Boolean deleted;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProtectionAlert {
        private String messageId;
        private String eventType;
        private String riskLevel;
        private String message;
        private String contentPreview;
        private String detectionType;
    }
}
