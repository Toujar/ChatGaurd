package com.chatguard.service;

import com.chatguard.dto.MessageDTO;
import com.chatguard.entity.*;
import com.chatguard.kafka.ProtectionEventProducer;
import com.chatguard.repository.MessageRepository;
import com.chatguard.repository.ProtectionRuleRepository;
import com.chatguard.repository.UserRepository;
import com.chatguard.repository.VerificationEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProtectionService {

    private final ProtectionRuleRepository protectionRuleRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final VerificationEventRepository verificationEventRepository;
    private final ProtectionEventProducer protectionEventProducer;
    private final ObjectMapper objectMapper;

    private static final Map<String, Pattern> SENSITIVE_PATTERNS = Map.of(
            "credit_card", Pattern.compile("\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b"),
            "ssn", Pattern.compile("\\b\\d{3}[\\s-]?\\d{2}[\\s-]?\\d{4}\\b"),
            "email", Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"),
            "api_key", Pattern.compile("(?i)(api[_\\-]?key|apikey|secret|token)[\\s:=]+['\"]?[\\w\\-]{16,}['\"]?"),
            "password", Pattern.compile("(?i)(password|passwd|pwd)[\\s:=]+['\"]?[\\w\\-@#$%^&*()!]{8,}['\"]?")
    );

    public ProtectionResult analyzeMessage(String content, String organizationId, String userId) {
        List<ProtectionRule> activeRules = protectionRuleRepository.findActiveRulesByPriority(organizationId);
        List<DetectionResult> detections = new ArrayList<>();

        for (ProtectionRule rule : activeRules) {
            switch (rule.getRuleType()) {
                case SENSITIVE_CONTENT -> {
                    DetectionResult result = detectSensitiveContent(content, rule);
                    if (result != null) detections.add(result);
                }
                case BULK_MESSAGE -> {
                }
                case FORWARD_PROTECTION -> {
                }
                case WRONG_RECIPIENT -> {
                }
                case DELETE_PROTECTION -> {
                }
                case FILE_UPLOAD -> {
                }
            }
        }

        if (!detections.isEmpty()) {
            ProtectionRule.RuleType highestPriorityType = detections.stream()
                    .map(d -> d.rule().getRuleType())
                    .findFirst()
                    .orElse(null);

            ProtectionRule.ActionType action = detections.stream()
                    .map(d -> d.rule().getAction())
                    .reduce((a, b) -> a.ordinal() > b.ordinal() ? a : b)
                    .orElse(ProtectionRule.ActionType.WARN);

            ProtectionRule.Severity severity = detections.stream()
                    .map(d -> d.rule().getSeverity())
                    .reduce((a, b) -> a.ordinal() > b.ordinal() ? a : b)
                    .orElse(ProtectionRule.Severity.MEDIUM);

            return new ProtectionResult(true, highestPriorityType, action, severity, detections);
        }

        return new ProtectionResult(false, null, null, null, List.of());
    }

    private DetectionResult detectSensitiveContent(String content, ProtectionRule rule) {
        try {
            Map<String, Object> conditions = objectMapper.readValue(rule.getConditions(), Map.class);
            @SuppressWarnings("unchecked")
            List<String> patternNames = (List<String>) conditions.get("patterns");

            for (String patternName : patternNames) {
                Pattern pattern = SENSITIVE_PATTERNS.get(patternName.toLowerCase().replace("_", "").replace(" ", ""));
                if (pattern != null && pattern.matcher(content).find()) {
                    return new DetectionResult(rule, patternName, null);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse rule conditions: {}", e.getMessage());
        }
        return null;
    }

    public VerificationEvent createVerificationEvent(Organization organization, User user, Message message,
                                                      VerificationEvent.EventType eventType,
                                                      VerificationEvent.RiskLevel riskLevel,
                                                      Map<String, Object> details) {
        VerificationEvent event = VerificationEvent.builder()
                .organization(organization)
                .user(user)
                .message(message)
                .eventType(eventType)
                .riskLevel(riskLevel)
                .details(details != null ? details.toString() : null)
                .build();

        event = verificationEventRepository.save(event);

        protectionEventProducer.sendProtectionEvent(event);
        userRepository.updateRiskScore(user.getId(), calculateRiskScoreDelta(riskLevel));

        return event;
    }

    private Integer calculateRiskScoreDelta(VerificationEvent.RiskLevel riskLevel) {
        return switch (riskLevel) {
            case LOW -> 2;
            case MEDIUM -> 5;
            case HIGH -> 10;
            case CRITICAL -> 20;
        };
    }

    public void markEventResolved(String eventId, VerificationEvent.UserAction userAction) {
        verificationEventRepository.findById(eventId).ifPresent(event -> {
            event.setUserAction(userAction);
            event.setResolvedAt(LocalDateTime.now());
            verificationEventRepository.save(event);
        });
    }

    public MessageDTO.ProtectionAlert toProtectionAlert(DetectionResult detection, String content) {
        String eventType = switch (detection.rule().getRuleType()) {
            case SENSITIVE_CONTENT -> "sensitive_send";
            case WRONG_RECIPIENT -> "wrong_recipient";
            case FORWARD_PROTECTION -> "forward_confirm";
            case BULK_MESSAGE -> "bulk_confirm";
            case DELETE_PROTECTION -> "delete_confirm";
            case FILE_UPLOAD -> "file_confirm";
        };

        String riskLevel = switch (detection.rule().getSeverity()) {
            case LOW -> "low";
            case MEDIUM -> "medium";
            case HIGH -> "high";
            case CRITICAL -> "critical";
        };

        return MessageDTO.ProtectionAlert.builder()
                .eventType(eventType)
                .riskLevel(riskLevel)
                .message("Sensitive content detected: " + detection.detectionType())
                .contentPreview(content.length() > 50 ? content.substring(0, 50) + "..." : content)
                .detectionType(detection.detectionType())
                .build();
    }

    public record ProtectionResult(
            boolean detected,
            ProtectionRule.RuleType ruleType,
            ProtectionRule.ActionType action,
            ProtectionRule.Severity severity,
            List<DetectionResult> detections
    ) {}

    public record DetectionResult(
            ProtectionRule rule,
            String detectionType,
            String matchedValue
    ) {}
}
