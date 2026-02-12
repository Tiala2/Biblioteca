# ============================
# 1) STAGE DE BUILD
# ============================
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copia tudo para dentro do container
COPY . .

# Dá permissão ao gradlew
RUN chmod +x ./gradlew

# Build do jar (sem testes)
RUN ./gradlew clean bootJar --no-daemon -x test


# ============================
# 2) STAGE DE RUNTIME (LEVE)
# ============================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copia o jar gerado no stage anterior
COPY --from=builder /app/build/libs/library-api-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

# Otimizações de memória para cloud
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
