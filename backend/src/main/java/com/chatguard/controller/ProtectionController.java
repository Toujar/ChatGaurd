package com.chatguard.controller;

import com.chatguard.entity.ProtectionRule;
import com.chatguard.entity.VerificationEvent;
import com.chatguard.repository.ProtectionRuleRepository;
import com.chatguard.repository.UserRepository;
import com.chatguard.repository.VerificationEventRepository;
import com.chatguard.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/protection")
@RequiredArgsConstructor
public class ProtectionController {

    private final ProtectionRuleRepository protectionRuleRepository;
    private final VerificationEventRepository verificationEventRepository;
    private final UserRepository userRepository;

    @GetMapping("/rules")
    public ResponseEntity<List<ProtectionRule>> getProtectionRules(
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        String orgId = user.getOrganization().getId();
        List<ProtectionRule> rules = protectionRuleRepository.findByOrganizationId(orgId);

        return ResponseEntity.ok(rules);
    }

    @GetMapping("/rules/active")
    public ResponseEntity<List<ProtectionRule>> getActiveRules(
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        String orgId = user.getOrganization().getId();
        List<ProtectionRule> rules = protectionRuleRepository.findActiveRulesByPriority(orgId);

        return ResponseEntity.ok(rules);
    }

    @PostMapping("/rules")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProtectionRule> createRule(
            @RequestBody ProtectionRule rule,
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        rule.setOrganization(user.getOrganization());
        rule.setCreatedBy(user);

        ProtectionRule saved = protectionRuleRepository.save(rule);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProtectionRule> updateRule(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates,
            @AuthenticationPrincipal UserDetails userDetails) {

        ProtectionRule rule = protectionRuleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rule not found"));

        if (updates.containsKey("enabled")) {
            rule.setEnabled((Boolean) updates.get("enabled"));
        }
        if (updates.containsKey("action")) {
            rule.setAction(ProtectionRule.ActionType.valueOf((String) updates.get("action")));
        }
        if (updates.containsKey("severity")) {
            rule.setSeverity(ProtectionRule.Severity.valueOf((String) updates.get("severity")));
        }

        ProtectionRule saved = protectionRuleRepository.save(rule);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRule(@PathVariable String id) {
        protectionRuleRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/events")
    public ResponseEntity<Page<VerificationEvent>> getVerificationEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        String orgId = user.getOrganization().getId();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<VerificationEvent> events = verificationEventRepository.findByOrganizationId(orgId, pageable);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/events/pending")
    public ResponseEntity<List<VerificationEvent>> getPendingEvents(
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        String orgId = user.getOrganization().getId();
        List<VerificationEvent> events = verificationEventRepository.findByOrganizationIdAndResolvedAtIsNull(orgId);

        return ResponseEntity.ok(events);
    }

    @PostMapping("/events/{id}/resolve")
    public ResponseEntity<Void> resolveEvent(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        VerificationEvent.UserAction action = VerificationEvent.UserAction.valueOf(request.get("action"));

        VerificationEvent event = verificationEventRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        event.setUserAction(action);
        event.setResolvedAt(java.time.LocalDateTime.now());
        verificationEventRepository.save(event);

        return ResponseEntity.ok().build();
    }
}
