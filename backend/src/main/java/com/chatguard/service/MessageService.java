package com.chatguard.service;

import com.chatguard.dto.MessageDTO;
import com.chatguard.entity.*;
import com.chatguard.exception.EntityNotFoundException;
import com.chatguard.repository.ChannelRepository;
import com.chatguard.repository.MessageRepository;
import com.chatguard.repository.UserRepository;
import com.chatguard.websocket.WebSocketMessageSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final ProtectionService protectionService;
    private final AuditService auditService;
    private final WebSocketMessageSender webSocketMessageHandler;

    @Transactional
    public MessageDTO.Response sendMessage(MessageDTO.CreateRequest request, String senderEmail) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        ProtectionService.ProtectionResult protectionResult = protectionService.analyzeMessage(
                request.getContent(),
                sender.getOrganization().getId(),
                sender.getId()
        );

        Message message = Message.builder()
                .channel(request.getChannelId() != null ?
                        channelRepository.findById(request.getChannelId()).orElse(null) : null)
                .sender(sender)
                .recipient(request.getRecipientId() != null ?
                        userRepository.findById(request.getRecipientId()).orElse(null) : null)
                .parentMessage(request.getParentMessageId() != null ?
                        messageRepository.findById(request.getParentMessageId()).orElse(null) : null)
                .content(request.getContent())
                .contentType(Message.ContentType.valueOf(request.getContentType()))
                .sensitivityDetected(protectionResult.detected())
                .sensitivityType(protectionResult.detected() ? protectionResult.ruleType().name() : null)
                .protectionTriggered(protectionResult.detected() && protectionResult.action() != null)
                .protectionType(protectionResult.detected() ? protectionResult.action().name() : null)
                .build();

        message = messageRepository.save(message);

        if (protectionResult.detected()) {
            protectionService.createVerificationEvent(
                    sender.getOrganization(),
                    sender,
                    message,
                    VerificationEvent.EventType.SENSITIVE_SEND,
                    mapSeverityToRiskLevel(protectionResult.severity()),
                    Map.of("contentPreview", truncate(request.getContent(), 50))
            );

            if (protectionResult.action() == ProtectionRule.ActionType.BLOCK) {
                message.setDeletedAt(LocalDateTime.now());
                message.setDeletedBy(sender);
                message = messageRepository.save(message);
            }
        }

        auditService.log(sender.getOrganization(), sender, "message.sent", "message", message.getId(),
                Map.of("channelId", request.getChannelId(), "protected", protectionResult.detected()));

        if (!protectionResult.detected() || protectionResult.action() != ProtectionRule.ActionType.BLOCK) {
            webSocketMessageHandler.broadcastMessage(message.getChannel() != null ? message.getChannel().getId() : null,
                    toResponse(message));
        }

        return toResponse(message);
    }

    @Transactional
    public MessageDTO.Response updateMessage(String messageId, MessageDTO.UpdateRequest request, String userEmail) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (!message.getSender().getId().equals(user.getId())) {
            throw new EntityNotFoundException("Not authorized to update this message");
        }

        message.setContent(request.getContent());
        message.setEditedAt(LocalDateTime.now());
        message.setEditedBy(user);

        message = messageRepository.save(message);

        auditService.log(user.getOrganization(), user, "message.edited", "message", message.getId(),
                Map.of("newContent", truncate(request.getContent(), 50)));

        return toResponse(message);
    }

    @Transactional
    public void deleteMessage(String messageId, String userEmail) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (!message.getSender().getId().equals(user.getId()) &&
                user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.MANAGER) {
            throw new EntityNotFoundException("Not authorized to delete this message");
        }

        if (message.getChannel() != null &&
                (message.getChannel().getSensitivityLevel() == Channel.SensitivityLevel.CONFIDENTIAL ||
                        message.getChannel().getSensitivityLevel() == Channel.SensitivityLevel.SENSITIVE)) {
            ProtectionService.ProtectionResult result = protectionService.analyzeMessage(
                    message.getContent(),
                    user.getOrganization().getId(),
                    user.getId()
            );
            if (result.detected()) {
                protectionService.createVerificationEvent(
                        user.getOrganization(), user, message,
                        VerificationEvent.EventType.DELETE_CONFIRM,
                        VerificationEvent.RiskLevel.HIGH,
                        Map.of("action", "delete")
                );
            }
        }

        messageRepository.softDelete(messageId, LocalDateTime.now(), user.getId());

        auditService.log(user.getOrganization(), user, "message.deleted", "message", messageId, null);
    }

    public Page<MessageDTO.Response> getChannelMessages(String channelId, String userEmail, int page, int size) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Message> messages = messageRepository.findActiveMessagesByChannel(channelId, pageable);

        return messages.map(this::toResponse);
    }

    public List<MessageDTO.Response> getDirectMessages(String userId, String userEmail) {
        userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        List<Message> messages = messageRepository.findDirectMessages(userId);
        return messages.stream().map(this::toResponse).toList();
    }

    private MessageDTO.Response toResponse(Message message) {
        return MessageDTO.Response.builder()
                .id(message.getId())
                .channelId(message.getChannel() != null ? message.getChannel().getId() : null)
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .senderAvatar(message.getSender().getAvatarUrl())
                .recipientId(message.getRecipient() != null ? message.getRecipient().getId() : null)
                .parentMessageId(message.getParentMessage() != null ? message.getParentMessage().getId() : null)
                .content(message.getContent())
                .contentType(message.getContentType().name())
                .sensitivityDetected(message.getSensitivityDetected())
                .sensitivityType(message.getSensitivityType())
                .protectionTriggered(message.getProtectionTriggered())
                .protectionType(message.getProtectionType())
                .editedAt(message.getEditedAt())
                .deleted(message.getDeletedAt() != null)
                .createdAt(message.getCreatedAt())
                .build();
    }

    private VerificationEvent.RiskLevel mapSeverityToRiskLevel(ProtectionRule.Severity severity) {
        return switch (severity) {
            case LOW -> VerificationEvent.RiskLevel.LOW;
            case MEDIUM -> VerificationEvent.RiskLevel.MEDIUM;
            case HIGH -> VerificationEvent.RiskLevel.HIGH;
            case CRITICAL -> VerificationEvent.RiskLevel.CRITICAL;
        };
    }

    private String truncate(String str, int maxLength) {
        return str != null && str.length() > maxLength ? str.substring(0, maxLength) + "..." : str;
    }
}
