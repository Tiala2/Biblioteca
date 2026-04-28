package com.unichristus.libraryapi.infrastructure.tracing;

import com.unichristus.libraryapi.infrastructure.security.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Slf4j
@Component
@Order(2)
public class AdminAuditLoggingFilter extends OncePerRequestFilter {

    private static final Set<String> MUTATION_METHODS = Set.of(
            HttpMethod.POST.name(),
            HttpMethod.PUT.name(),
            HttpMethod.PATCH.name(),
            HttpMethod.DELETE.name()
    );

    @Override
    protected void doFilterInternal(
            @NotNull HttpServletRequest request,
            @NotNull HttpServletResponse response,
            @NotNull FilterChain filterChain
    ) throws ServletException, IOException {
        long startedAt = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            if (shouldAudit(request)) {
                log.info(
                        "ADMIN_AUDIT actorUserId={} actorEmail={} method={} path={} status={} durationMs={} traceId={}",
                        actorUserId(),
                        actorEmail(),
                        request.getMethod(),
                        request.getRequestURI(),
                        response.getStatus(),
                        System.currentTimeMillis() - startedAt,
                        MDC.get(TraceIdFilter.TRACE_ID_KEY)
                );
            }
        }
    }

    private boolean shouldAudit(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/api/admin/")
                && MUTATION_METHODS.contains(request.getMethod());
    }

    private Object actorUserId() {
        Object principal = principal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getId();
        }
        return "anonymous";
    }

    private Object actorEmail() {
        Object principal = principal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getEmail();
        }
        return "anonymous";
    }

    private Object principal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null ? null : authentication.getPrincipal();
    }
}
