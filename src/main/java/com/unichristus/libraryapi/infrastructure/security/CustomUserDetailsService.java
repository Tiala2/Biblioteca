package com.unichristus.libraryapi.infrastructure.security;

import com.unichristus.libraryapi.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public CustomUserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .map(CustomUserDetails::from)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }

    public CustomUserDetails loadUserById(UUID userId) {
        return userRepository.findById(userId)
                .map(CustomUserDetails::from)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + userId));
    }

}
