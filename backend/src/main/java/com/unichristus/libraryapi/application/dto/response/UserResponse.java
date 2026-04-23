package com.unichristus.libraryapi.application.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String name;
    private String email;
    private Boolean active;
    private Boolean leaderboardOptIn;
    private Boolean alertsOptIn;
    private List<BadgeResponse> badges;
}
