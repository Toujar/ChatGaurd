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
public class NotificationPayload {
    private String userId;
    private String type;
    private String title;
    private String content;
    private Object data;
    private LocalDateTime timestamp;
}
