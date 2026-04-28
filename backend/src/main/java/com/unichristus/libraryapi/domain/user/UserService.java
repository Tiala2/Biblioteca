package com.unichristus.libraryapi.domain.user;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;
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

    public Page<User> search(String query, Boolean active, UserRole role, Pageable pageable) {
        String normalizedQuery = query == null || query.isBlank() ? null : query.trim().toLowerCase();
        if (normalizedQuery == null && active == null && role == null) {
            return findAll(pageable);
        }
        return userRepository.search(normalizedQuery, active, role, pageable);
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

    public void updateUser(UUID id, String name, String email, String password, Boolean leaderboardOptIn, Boolean alertsOptIn) {
        updateUser(id, name, email, password, leaderboardOptIn, alertsOptIn, null);
    }

    public void updateUser(UUID id, String name, String email, String password, Boolean leaderboardOptIn, Boolean alertsOptIn, UserRole role) {
        User user = findUserByIdOrThrow(id);
        boolean changed = false;

        if (name != null && !name.isBlank() && !name.equals(user.getName())) {
            user.setName(name);
            changed = true;
        }

        if (email != null && !email.isBlank() && !email.equals(user.getEmail())) {
            validateEmailUnique(email);
            user.setEmail(email);
            changed = true;
        }

        if (password != null && !password.isEmpty()) {
            user.setPassword(passwordHasher.hash(password));
            changed = true;
        }

        if (leaderboardOptIn != null && !leaderboardOptIn.equals(user.getLeaderboardOptIn())) {
            user.setLeaderboardOptIn(leaderboardOptIn);
            changed = true;
        }

        if (alertsOptIn != null && !alertsOptIn.equals(user.getAlertsOptIn())) {
            user.setAlertsOptIn(alertsOptIn);
            changed = true;
        }

        if (role != null && role != user.getRole()) {
            user.setRole(role);
            changed = true;
        }

        if (changed) {
            save(user);
        }
    }

    public void updateUserAsAdmin(
            UUID actorUserId,
            UUID targetUserId,
            String name,
            String email,
            String password,
            Boolean leaderboardOptIn,
            Boolean alertsOptIn,
            UserRole role
    ) {
        if (actorUserId.equals(targetUserId) && role == UserRole.USER) {
            throw new DomainException(DomainError.USER_ROLE_SELF_CHANGE_FORBIDDEN);
        }
        updateUser(targetUserId, name, email, password, leaderboardOptIn, alertsOptIn, role);
    }

    public void invalidateUser(User user) {
        if (Boolean.FALSE.equals(user.getActive())) {
            return;
        }
        user.setActive(false);
        userRepository.save(user);
    }

    public void reactivateUser(User user) {
        if (Boolean.TRUE.equals(user.getActive())) {
            return;
        }
        user.setActive(true);
        userRepository.save(user);
    }

    public long count() {
        return userRepository.count();
    }

    private void validateEmailUnique(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new EmailConflictException(email);
        }
    }
}
