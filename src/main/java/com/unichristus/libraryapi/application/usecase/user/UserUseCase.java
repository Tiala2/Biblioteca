package com.unichristus.libraryapi.application.usecase.user;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.request.UserRegisterRequest;
import com.unichristus.libraryapi.application.dto.request.UserUpdateRequest;
import com.unichristus.libraryapi.application.dto.response.UserResponse;
import com.unichristus.libraryapi.application.mapper.UserResponseMapper;
import com.unichristus.libraryapi.domain.user.User;
import com.unichristus.libraryapi.domain.user.UserService;
import com.unichristus.libraryapi.domain.user.exception.EmailConflictException;
import com.unichristus.libraryapi.infrastructure.security.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

@UseCase
@RequiredArgsConstructor
public class UserUseCase {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getUserById(UUID userId) {
        User user = userService.findUserByIdOrThrow(userId);
        return UserResponseMapper.toUserResponse(user);
    }

    public UserResponse register(UserRegisterRequest request) {
        if (userService.existsByEmail(request.email())) {
            throw new EmailConflictException(request.email());
        }
        User savedUser = userService.save(
                User.builder()
                        .name(request.name().trim())
                        .email(request.email())
                        .password(passwordEncoder.encode(request.password()))
                        .role(Role.USER)
                        .active(Boolean.TRUE).build()
        );
        return UserResponseMapper.toUserResponse(savedUser);
    }

    public void updateUser(UUID userId, UserUpdateRequest request) {
        userService.updateUser(userId, request.name(), request.email(), request.password());
    }

    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userService.findAll(pageable).map(UserResponseMapper::toUserResponse);
    }

    public void invalidateUser(UUID userId) {
        User user = userService.findUserByIdOrThrow(userId);
        userService.invalidateUser(user);
    }
}
