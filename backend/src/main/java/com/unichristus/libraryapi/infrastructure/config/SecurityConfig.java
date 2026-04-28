package com.unichristus.libraryapi.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unichristus.libraryapi.application.dto.response.ErrorResponse;
import com.unichristus.libraryapi.infrastructure.security.JwtAuthenticationFilter;
import com.unichristus.libraryapi.domain.user.UserRole;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;
    @Value("#{'${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}'.split(',')}")
    private List<String> allowedOrigins;
    @Value("${springdoc.api-docs.enabled:true}")
    private boolean apiDocsEnabled;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {})
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'self'; " +
                                "frame-ancestors 'none'; " +
                                "object-src 'none'; " +
                                "base-uri 'self'; " +
                                "form-action 'self'"
                        ))
                        .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .frameOptions(frame -> frame.deny())
                        .addHeaderWriter(new StaticHeadersWriter("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()"))
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, ex) ->
                                writeJsonError(response, HttpStatus.UNAUTHORIZED, "AUTHENTICATION_FAILED", "Autenticacao obrigatoria ou invalida."))
                        .accessDeniedHandler((request, response, ex) ->
                                writeJsonError(response, HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Acesso negado."))
                )
                .authorizeHttpRequests(auth -> auth
                    // Admin area requires ADMIN role (Spring adds the ROLE_ prefix automatically)
                    .requestMatchers(ServiceURI.ADMIN + "/**").hasRole(UserRole.ADMIN.name())
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                ServiceURI.AUTH_RESOURCE + "/**",
                                ServiceURI.AUTH_RESOURCE + "/login",
                                ServiceURI.AUTH_RESOURCE + "/forgot-password"
                        ).permitAll()
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/info"
                        ).permitAll()
                        .requestMatchers("/actuator/**").hasRole(UserRole.ADMIN.name())
                        .requestMatchers(HttpMethod.GET, ServiceURI.BOOKS_RESOURCE, ServiceURI.BOOKS_RESOURCE + "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, ServiceURI.CATEGORIES_RESOURCE, ServiceURI.CATEGORIES_RESOURCE + "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, ServiceURI.COLLECTIONS_RESOURCE, ServiceURI.COLLECTIONS_RESOURCE + "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, ServiceURI.TAGS_RESOURCE, ServiceURI.TAGS_RESOURCE + "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, ServiceURI.REVIEWS_RESOURCE + "/me").authenticated()
                        .requestMatchers(HttpMethod.GET, ServiceURI.REVIEWS_RESOURCE, ServiceURI.REVIEWS_RESOURCE + "/*").permitAll()
                        .requestMatchers(HttpMethod.GET, ServiceURI.USERS_RESOURCE + "/leaderboard").permitAll()
                        .requestMatchers(HttpMethod.POST, ServiceURI.USERS_RESOURCE).permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").access((authentication, context) ->
                                new org.springframework.security.authorization.AuthorizationDecision(apiDocsEnabled))
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider daoAuthenticationProvider = new DaoAuthenticationProvider(userDetailsService);
        daoAuthenticationProvider.setPasswordEncoder(passwordEncoder);
        return daoAuthenticationProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins.stream().map(String::trim).filter(origin -> !origin.isBlank()).toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With", "X-Trace-Id"));
        configuration.setExposedHeaders(List.of("X-Trace-Id"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private void writeJsonError(jakarta.servlet.http.HttpServletResponse response, HttpStatus status, String code, String message) throws java.io.IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), new ErrorResponse(code, message));
    }
}
