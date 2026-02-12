package com.unichristus.libraryapi.domain.user;

import com.unichristus.libraryapi.domain.user.exception.EmailConflictException;
import com.unichristus.libraryapi.domain.user.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordHasher passwordHasher;

    public Page<User> findAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public User findUserByIdOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId.toString()));
    }

    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public void updateUser(UUID id, String name, String email, String password) {
        User user = findUserByIdOrThrow(id);
        boolean changed = false;

        if (name != null && !name.equals(user.getName())) {
            user.setName(name);
            changed = true;
        }

        if (email != null && !email.equals(user.getEmail())) {
            validateEmailUnique(email);
            user.setEmail(email);
            changed = true;
        }

        if (password != null && !password.isEmpty()) {
            user.setPassword(passwordHasher.hash(password));
            changed = true;
        }

        if (changed) {
            save(user);
        }
    }

    public void invalidateUser(User user) {
        user.setActive(false);
        userRepository.save(user);
    }

    private void validateEmailUnique(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new EmailConflictException(email);
        }
    }
}