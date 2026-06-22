package com.chatguard.dto;

import com.chatguard.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private String id;
    private String organizationId;
    private String organizationName;
    private String email;
    private String fullName;
    private String displayName;
    private String avatarUrl;
    private User.Role role;
    private User.Status status;
    private Integer riskScore;
    private Boolean emailVerified;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}

