package com.chatguard.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProtectionEventPayload {
    private String eventId;
    private String organizationId;
    private String userId;
    private String messageId;
    private String eventType;
    private String riskLevel;
    private String details;
    private LocalDateTime timestamp;
}


