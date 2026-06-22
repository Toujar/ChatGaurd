package com.chatguard.kafka;

import com.chatguard.entity.VerificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProtectionEventProducer {

    private static final String PROTECTION_EVENTS_TOPIC = "chatguard.protection.events";
    private static final String NOTIFICATION_TOPIC = "chatguard.notifications";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendProtectionEvent(VerificationEvent event) {
        ProtectionEventPayload payload = ProtectionEventPayload.builder()
                .eventId(event.getId())
                .organizationId(event.getOrganization().getId())
                .userId(event.getUser().getId())
                .messageId(event.getMessage() != null ? event.getMessage().getId() : null)
                .eventType(event.getEventType().name())
                .riskLevel(event.getRiskLevel().name())
                .details(event.getDetails())
                .timestamp(event.getCreatedAt())
                .build();

        kafkaTemplate.send(PROTECTION_EVENTS_TOPIC, event.getId(), payload)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to send protection event: {}", ex.getMessage());
                    } else {
                        log.debug("Sent protection event: {}", event.getId());
                    }
                });
    }

    public void sendNotification(NotificationPayload payload) {
        kafkaTemplate.send(NOTIFICATION_TOPIC, payload.getUserId(), payload)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to send notification: {}", ex.getMessage());
                    }
                });
    }
}
