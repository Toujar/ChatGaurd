package com.chatguard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ChannelDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String name;
        private String description;
        @Builder.Default
        private String type = "PUBLIC";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private String id;
        private String organizationId;
        private String name;
        private String description;
        private String type;
        private String sensitivityLevel;
        private String createdBy;
        private Long memberCount;
    }
}
