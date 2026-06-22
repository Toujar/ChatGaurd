package com.chatguard.controller;

import com.chatguard.dto.UserDTO;
import com.chatguard.entity.User;
import com.chatguard.repository.UserRepository;
import com.chatguard.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserDTO>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String role,
            @AuthenticationPrincipal UserDetails userDetails) {

        var currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        String orgId = currentUser.getOrganization().getId();
        Pageable pageable = PageRequest.of(page, size);

        Page<User> users;
        if (role != null && !role.isBlank()) {
            users = userRepository.findByOrganizationIdAndRole(orgId, User.Role.valueOf(role), pageable);
        } else {
            users = userRepository.findByOrganizationId(orgId, pageable);
        }

        Page<UserDTO> dtos = users.map(this::toDTO);
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateUserRole(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        User.Role newRole = User.Role.valueOf(request.get("role"));
        user.setRole(newRole);
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateUserStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        User.Status newStatus = User.Status.valueOf(request.get("status"));
        user.setStatus(newStatus);
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/users/high-risk")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<UserDTO>> getHighRiskUsers(
            @RequestParam(defaultValue = "30") Integer threshold,
            @AuthenticationPrincipal UserDetails userDetails) {

        var currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        String orgId = currentUser.getOrganization().getId();
        List<User> users = userRepository.findHighRiskUsers(orgId, threshold);

        return ResponseEntity.ok(users.stream().map(this::toDTO).toList());
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Long>> getStatistics(
            @AuthenticationPrincipal UserDetails userDetails) {

        var currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        String orgId = currentUser.getOrganization().getId();

        return ResponseEntity.ok(Map.of(
                "totalUsers", userRepository.countByOrganizationIdAndStatus(orgId, User.Status.ACTIVE),
                "activeUsers", userRepository.countByOrganizationIdAndStatus(orgId, User.Status.ACTIVE),
                "suspendedUsers", userRepository.countByOrganizationIdAndStatus(orgId, User.Status.SUSPENDED),
                "pendingUsers", userRepository.countByOrganizationIdAndStatus(orgId, User.Status.PENDING)
        ));
    }

    private UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .organizationId(user.getOrganization() != null ? user.getOrganization().getId() : null)
                .organizationName(user.getOrganization() != null ? user.getOrganization().getName() : null)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .status(user.getStatus())
                .riskScore(user.getRiskScore())
                .emailVerified(user.getEmailVerified())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
