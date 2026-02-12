package com.unichristus.libraryapi.domain.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository {

    User save(User user);

    Optional<User> findById(UUID id);

    Page<User> findAll(Pageable pageable);

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);
}