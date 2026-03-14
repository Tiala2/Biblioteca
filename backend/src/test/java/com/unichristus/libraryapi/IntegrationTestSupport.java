package com.unichristus.libraryapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.unichristus.libraryapi.infrastructure.persistence.user.PasswordResetTokenJpaRepository;
import com.unichristus.libraryapi.infrastructure.persistence.user.UserJpaRepository;
import com.unichristus.libraryapi.domain.user.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public abstract class IntegrationTestSupport extends AbstractIntegrationTest {

    @Autowired
    protected UserJpaRepository userJpaRepository;

    @Autowired
    protected PasswordResetTokenJpaRepository passwordResetTokenJpaRepository;

    protected void registerUser(String name, String email, String password) throws Exception {
        String payload = "{" +
                "\"name\":\"" + name + "\"," +
                "\"email\":\"" + email + "\"," +
                "\"password\":\"" + password + "\"" +
                "}";

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());
    }

    protected String loginAndGetToken(String email, String password) throws Exception {
        String payload = "{" +
                "\"email\":\"" + email + "\"," +
                "\"password\":\"" + password + "\"" +
                "}";

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        String token = json.path("token").asText();
        assertThat(token).isNotBlank();
        return token;
    }

    protected String registerAndLogin(String name, String email, String password) throws Exception {
        registerUser(name, email, password);
        return loginAndGetToken(email, password);
    }

    protected String registerPromoteAndLoginAdmin(String name, String email, String password) throws Exception {
        registerUser(name, email, password);
        var user = userJpaRepository.findByEmail(email).orElseThrow();
        user.setRole(UserRole.ADMIN);
        userJpaRepository.save(user);
        return loginAndGetToken(email, password);
    }
}

