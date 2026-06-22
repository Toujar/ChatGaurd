package com.chatguard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AnalyticsDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStats {
        private Long activeUsers;
        private Long messagesSent;
        private Long protectedMessages;
        private Long riskEvents;
        private Integer averageRiskScore;
        private Integer complianceScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskDistribution {
        private String level;
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserRiskScore {
        private String id;
        private String name;
        private Integer riskScore;
        private String role;
        private String trend;
    }
}
