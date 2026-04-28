package com.unichristus.libraryapi.infrastructure.persistence.user;

import com.unichristus.libraryapi.domain.user.User;
import com.unichristus.libraryapi.domain.user.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserJpaRepository extends JpaRepository<User, UUID> {
    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    @Query("""
            select u
            from User u
            where (:query is null
                or lower(u.name) like lower(concat('%', :query, '%'))
                or lower(u.email) like lower(concat('%', :query, '%')))
              and (:active is null or u.active = :active)
              and (:role is null or u.role = :role)
            """)
    Page<User> search(@Param("query") String query,
                      @Param("active") Boolean active,
                      @Param("role") UserRole role,
                      Pageable pageable);
}
