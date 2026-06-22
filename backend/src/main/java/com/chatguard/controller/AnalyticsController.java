package com.chatguard.controller;

import com.chatguard.dto.AnalyticsDTO;
import com.chatguard.entity.VerificationEvent;
import com.chatguard.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final VerificationEventRepository verificationEventRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AnalyticsDTO.DashboardStats> getDashboardStats(
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();
        String orgId = user.getOrganization().getId();

        LocalDateTime today = LocalDateTime.now();
        LocalDateTime startOfWeek = today.minusDays(7);

        Long activeUsers = userRepository.countByOrganizationIdAndStatus(orgId, com.chatguard.entity.User.Status.ACTIVE);
        Long messagesSent = messageRepository.countMessagesSince(orgId, startOfWeek);
        Long protectedMessages = messageRepository.countProtectedMessagesSince(orgId, startOfWeek);
        Long riskEvents = verificationEventRepository.countEventsSince(orgId, startOfWeek);

        Double avgRiskScore = userRepository.getAverageRiskScore(orgId);
        if (avgRiskScore == null) avgRiskScore = 0.0;

        return ResponseEntity.ok(AnalyticsDTO.DashboardStats.builder()
                .activeUsers(activeUsers)
                .messagesSent(messagesSent)
                .protectedMessages(protectedMessages)
                .riskEvents(riskEvents)
                .averageRiskScore(avgRiskScore.intValue())
                .complianceScore(Math.max(0, 100 - avgRiskScore.intValue()))
                .build());
    }

    @GetMapping("/risk")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Object[]>> getRiskDistribution(
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();
        String orgId = user.getOrganization().getId();

        return ResponseEntity.ok(verificationEventRepository.countByRiskLevel(orgId));
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Object>> getUserRiskScores(
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();
        String orgId = user.getOrganization().getId();

        List<Object> users = userRepository.findByOrganizationId(orgId).stream()
                .<Object>map(u -> Map.of(
                        "id", u.getId(),
                        "name", u.getFullName(),
                        "riskScore", u.getRiskScore(),
                        "role", u.getRole().name()
                ))
                .toList();

        return ResponseEntity.ok(users);
    }
}
