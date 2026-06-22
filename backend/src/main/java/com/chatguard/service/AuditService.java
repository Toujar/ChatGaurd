package com.chatguard.service;

import com.chatguard.entity.AuditLog;
import com.chatguard.entity.Organization;
import com.chatguard.entity.User;
import com.chatguard.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Async
    public void log(Organization organization, User actor, String action, String resourceType,
                    String resourceId, Map<String, Object> details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .organization(organization)
                    .actor(actor)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .details(details != null ? objectMapper.writeValueAsString(details) : null)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to create audit log: {}", e.getMessage());
        }
    }

    public Page<AuditLog> getOrganizationLogs(String organizationId, Pageable pageable) {
        return auditLogRepository.findByOrganizationId(organizationId, pageable);
    }

    public Page<AuditLog> getActorLogs(String organizationId, String actorId, Pageable pageable) {
        return auditLogRepository.findByOrganizationIdAndActorId(organizationId, actorId, pageable);
    }

    public Page<AuditLog> searchLogs(String organizationId, String actionPrefix, Pageable pageable) {
        return auditLogRepository.findByActionPrefix(organizationId, actionPrefix, pageable);
    }
}
