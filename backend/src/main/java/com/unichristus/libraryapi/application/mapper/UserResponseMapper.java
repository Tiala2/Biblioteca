package com.unichristus.libraryapi.application.mapper;

import com.unichristus.libraryapi.application.dto.response.BadgeResponse;
import com.unichristus.libraryapi.application.dto.response.UserResponse;
import com.unichristus.libraryapi.domain.engagement.UserBadge;
import com.unichristus.libraryapi.domain.user.User;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class UserResponseMapper {

    public static UserResponse toUserResponse(User user, List<UserBadge> badges) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .active(user.getActive())
                .leaderboardOptIn(user.getLeaderboardOptIn())
                .alertsOptIn(user.getAlertsOptIn())
                .badges(toBadgeResponses(badges))
                .build();
    }

    private static List<BadgeResponse> toBadgeResponses(List<UserBadge> badges) {
        if (badges == null || badges.isEmpty()) return Collections.emptyList();
        return badges.stream()
                .filter(Objects::nonNull)
            .map(UserResponseMapper::toBadgeResponse)
                .toList();
    }

        public static BadgeResponse toBadgeResponse(UserBadge ub) {
        if (ub == null || ub.getBadge() == null) return null;
        return BadgeResponse.builder()
            .id(ub.getId())
            .code(ub.getBadge().getCode())
            .name(ub.getBadge().getName())
            .description(ub.getBadge().getDescription())
            .awardedAt(ub.getAwardedAt())
            .build();
        }
}
