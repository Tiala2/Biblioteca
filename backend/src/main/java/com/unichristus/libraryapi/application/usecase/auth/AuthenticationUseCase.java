package com.unichristus.libraryapi.application.usecase.auth;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.request.LoginRequest;
import com.unichristus.libraryapi.application.dto.response.AuthResponse;
import com.unichristus.libraryapi.domain.user.User;
import com.unichristus.libraryapi.domain.user.UserService;
import com.unichristus.libraryapi.domain.user.exception.UserNotFoundException;
import com.unichristus.libraryapi.infrastructure.security.CustomUserDetails;
import com.unichristus.libraryapi.infrastructure.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

@UseCase
@RequiredArgsConstructor
public class AuthenticationUseCase {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password().trim()
                )
        );
        User user = userService.findUserByEmail(request.email())
                .orElseThrow(() -> new UserNotFoundException(request.email()));
        return generateToken(user);
    }

    private AuthResponse generateToken(User user) {
        CustomUserDetails userDetails = CustomUserDetails.from(user);
        String token = jwtService.generateToken(userDetails);
        return new AuthResponse(token, "Bearer", user.getId(), user.getName(), user.getEmail());
    }
}