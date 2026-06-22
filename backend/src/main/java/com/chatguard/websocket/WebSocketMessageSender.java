package com.chatguard.websocket;

import com.chatguard.dto.MessageDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketMessageSender {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastMessage(String channelId, MessageDTO.Response message) {
        if (channelId != null) {
            String destination = "/topic/channel/" + channelId;
            messagingTemplate.convertAndSend(destination, message);
            log.debug("Broadcast message to channel: {}", channelId);
        }
    }

    public void sendToUser(String userId, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(userId, destination, payload);
        log.debug("Sent message to user: {} at {}", userId, destination);
    }

    public void sendNotification(String userId, Map<String, Object> notification) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notification);
        log.debug("Sent notification to user: {}", userId);
    }

    public void sendProtectionAlert(String userId, MessageDTO.ProtectionAlert alert) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/protection", alert);
        log.debug("Sent protection alert to user: {}", userId);
    }

    public void sendTypingIndicator(String channelId, String userId, String userName) {
        String destination = "/topic/channel/" + channelId + "/typing";
        messagingTemplate.convertAndSend(destination, Map.of(
                "userId", userId,
                "userName", userName,
                "timestamp", System.currentTimeMillis()
        ));
    }

    public void sendUserPresence(String userId, String status) {
        messagingTemplate.convertAndSend("/topic/presence", Map.of(
                "userId", userId,
                "status", status,
                "timestamp", System.currentTimeMillis()
        ));
    }
}
