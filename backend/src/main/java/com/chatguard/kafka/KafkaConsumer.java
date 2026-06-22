package com.chatguard.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumer {

    private static final String PROTECTION_EVENTS_TOPIC = "chatguard.protection.events";
    private static final String NOTIFICATION_TOPIC = "chatguard.notifications";

    @KafkaListener(topics = PROTECTION_EVENTS_TOPIC, groupId = "chatguard-analytics")
    public void consumeProtectionEvent(ProtectionEventPayload event) {
        log.info("Received protection event for analytics: {}", event.getEventId());
    }

    @KafkaListener(topics = PROTECTION_EVENTS_TOPIC, groupId = "chatguard-risk-engine")
    public void handleProtectionEventForRisk(ProtectionEventPayload event) {
        log.info("Processing protection event for risk calculation: {}", event.getEventId());
    }
}
