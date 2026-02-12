package com.unichristus.libraryapi.infrastructure.tracing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unichristus.libraryapi.infrastructure.security.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class LoggingFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public static final String TRACE_ID_KEY = "traceId";
    private static final String TRACE_ID_HEADER = "X-Trace-Id";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.contains("/auth") || uri.contains("/swagger") || uri.contains("/v3/api-docs");
    }

    @Override
    protected void doFilterInternal(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String traceId = UUID.randomUUID().toString();
        MDC.put(TRACE_ID_KEY, traceId);

        // Coloca o traceId no header da resposta
        response.setHeader(TRACE_ID_HEADER, traceId);

        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();
        filterChain.doFilter(requestWrapper, responseWrapper);
        long elapsed = System.currentTimeMillis() - startTime;

        logRequest(requestWrapper);
        logResponse(responseWrapper, elapsed);

        responseWrapper.copyBodyToResponse();
        MDC.remove(TRACE_ID_KEY);
    }

    private void logRequest(ContentCachingRequestWrapper requestWrapper) {
        String method = requestWrapper.getMethod();
        String uri = requestWrapper.getRequestURI();
        String token = getToken(requestWrapper);
        String userEmail = getAuthenticatedUserEmail(token);
        String params = getParams(requestWrapper);
        String requestBody = extractCompactJson(requestWrapper.getContentAsByteArray());
        log.debug(
                "REQUEST => {} {} | User={} | Params={} | Body={} | Token={}",
                method,
                uri,
                userEmail,
                params,
                requestBody,
                token
        );
    }

    private void logResponse(ContentCachingResponseWrapper responseWrapper, long time) {
        int status = responseWrapper.getStatus();
        String responseBody = extractCompactJson(responseWrapper.getContentAsByteArray());
        log.debug(
                "RESPONSE => Status={} | Time={}ms | ResponseBody: {}",
                status,
                time,
                responseBody
        );

    }

    private String extractCompactJson(byte[] content) {
        if (content == null || content.length == 0) return "none";
        String json = new String(content, StandardCharsets.UTF_8);
        json = json.trim();
        try {
            ObjectMapper mapper = new ObjectMapper();
            Object obj = mapper.readValue(json, Object.class);
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return json;
        }
    }

    private String getAuthenticatedUserEmail(String token) {
        try {
            String email = jwtService.extractEmail(token);
            return email != null ? email : "anonymous";
        } catch (Exception e) {
            log.debug("Failed to extract email from token: {}", e.getMessage());
            return "anonymous";
        }
    }

    private String getToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return "none";
        }
        return authHeader.substring(7);
    }

    private String getParams(HttpServletRequest request) {
        String queryString = request.getQueryString();
        return queryString != null ? queryString : "none";
    }
}
