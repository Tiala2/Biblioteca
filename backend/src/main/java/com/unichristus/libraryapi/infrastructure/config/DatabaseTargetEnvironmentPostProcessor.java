package com.unichristus.libraryapi.infrastructure.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;

import java.util.Arrays;

public class DatabaseTargetEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        boolean isDev = Arrays.asList(environment.getActiveProfiles()).contains("dev");
        boolean allowLocalDb = environment.getProperty("ALLOW_LOCAL_DB_5432", Boolean.class, false);
        String datasourceUrl = environment.getProperty("spring.datasource.url", "");

        if (isDev && !allowLocalDb && pointsToDefaultLocalPostgres(datasourceUrl)) {
            throw new IllegalStateException("""
                    Banco local em localhost:5432 bloqueado no perfil dev.
                    Use o Postgres do Docker em localhost:5437 ou defina ALLOW_LOCAL_DB_5432=true apenas se souber exatamente o que esta fazendo.
                    """);
        }
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    private boolean pointsToDefaultLocalPostgres(String datasourceUrl) {
        String normalized = datasourceUrl == null ? "" : datasourceUrl.toLowerCase();
        return normalized.contains("jdbc:postgresql://localhost:5432/")
                || normalized.contains("jdbc:postgresql://127.0.0.1:5432/");
    }
}
