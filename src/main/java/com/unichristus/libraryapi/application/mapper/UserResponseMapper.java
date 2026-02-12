package com.unichristus.libraryapi.application.mapper;

import com.unichristus.libraryapi.application.dto.response.UserResponse;
import com.unichristus.libraryapi.domain.user.User;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class UserResponseMapper {

    public static UserResponse toUserResponse(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }
}
