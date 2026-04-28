package com.unichristus.libraryapi.infrastructure.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ForgotPasswordRateLimitService {

    private final Map<String, Deque<Long>> requestsByClient = new ConcurrentHashMap<>();
    private final Clock clock;
    private final int maxRequests;
    private final long windowMillis;

    @Autowired
    public ForgotPasswordRateLimitService(
            @Value("${app.security.forgot-password-rate-limit.max-attempts:3}") int maxRequests,
            @Value("${app.security.forgot-password-rate-limit.window-seconds:1800}") long windowSeconds
    ) {
        this(Clock.systemUTC(), maxRequests, windowSeconds);
    }

    private ForgotPasswordRateLimitService(Clock clock, int maxRequests, long windowSeconds) {
        this.clock = clock;
        this.maxRequests = maxRequests;
        this.windowMillis = Math.max(windowSeconds, 1) * 1000;
    }

    public synchronized void checkAllowed(String clientKey) {
        String normalizedClientKey = normalize(clientKey);
        Deque<Long> requests = requestsByClient.computeIfAbsent(normalizedClientKey, ignored -> new ArrayDeque<>());
        purgeExpired(requests);
        if (requests.size() >= maxRequests) {
            throw new RateLimitExceededException("Muitas solicitacoes de recuperacao. Aguarde alguns minutos antes de tentar novamente.");
        }
        requests.addLast(clock.millis());
    }

    public synchronized void clearAllForTests() {
        requestsByClient.clear();
    }

    private void purgeExpired(Deque<Long> requests) {
        long cutoff = clock.millis() - windowMillis;
        while (!requests.isEmpty() && requests.peekFirst() < cutoff) {
            requests.removeFirst();
        }
    }

    private String normalize(String clientKey) {
        return clientKey == null || clientKey.isBlank() ? "unknown" : clientKey.trim();
    }
}
