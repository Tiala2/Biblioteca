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
public class LoginRateLimitService {

    private final Map<String, Deque<Long>> failedAttemptsByClient = new ConcurrentHashMap<>();
    private final Clock clock;
    private final int maxAttempts;
    private final long windowMillis;

    @Autowired
    public LoginRateLimitService(
            @Value("${app.security.login-rate-limit.max-attempts:5}") int maxAttempts,
            @Value("${app.security.login-rate-limit.window-seconds:900}") long windowSeconds
    ) {
        this(Clock.systemUTC(), maxAttempts, windowSeconds);
    }

    private LoginRateLimitService(Clock clock, int maxAttempts, long windowSeconds) {
        this.clock = clock;
        this.maxAttempts = maxAttempts;
        this.windowMillis = Math.max(windowSeconds, 1) * 1000;
    }

    public synchronized void checkAllowed(String clientKey) {
        Deque<Long> attempts = failedAttemptsByClient.get(normalize(clientKey));
        if (attempts == null) {
            return;
        }

        purgeExpired(attempts);
        if (attempts.isEmpty()) {
            failedAttemptsByClient.remove(normalize(clientKey));
            return;
        }

        if (attempts.size() >= maxAttempts) {
            throw new RateLimitExceededException("Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.");
        }
    }

    public synchronized void registerFailure(String clientKey) {
        String normalizedClientKey = normalize(clientKey);
        Deque<Long> attempts = failedAttemptsByClient.computeIfAbsent(normalizedClientKey, ignored -> new ArrayDeque<>());
        purgeExpired(attempts);
        attempts.addLast(clock.millis());
    }

    public synchronized void reset(String clientKey) {
        failedAttemptsByClient.remove(normalize(clientKey));
    }

    public synchronized void clearAllForTests() {
        failedAttemptsByClient.clear();
    }

    private void purgeExpired(Deque<Long> attempts) {
        long cutoff = clock.millis() - windowMillis;
        while (!attempts.isEmpty() && attempts.peekFirst() < cutoff) {
            attempts.removeFirst();
        }
    }

    private String normalize(String clientKey) {
        return clientKey == null || clientKey.isBlank() ? "unknown" : clientKey.trim();
    }
}
