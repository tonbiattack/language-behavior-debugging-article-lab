FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /workspace
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /workspace/target/redis-cache-service-1.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-Xms96m", "-Xmx192m", "-jar", "/app/app.jar"]
