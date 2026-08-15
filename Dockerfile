FROM maven:3.9.9-eclipse-temurin-21 AS spring-builder
WORKDIR /spring-service
COPY spring-service/pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY spring-service/src ./src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates redis-server \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
COPY --from=spring-builder /spring-service/target/redis-cache-service-1.0.0.jar /opt/debuglab/spring-cache.jar
RUN npm install -g corepack@latest && corepack pnpm install && corepack pnpm run build
ENV NODE_ENV=production \
  REDIS_SERVICE_URL=http://127.0.0.1:8081 \
  SPRING_DATA_REDIS_HOST=127.0.0.1 \
  SPRING_DATA_REDIS_PORT=6379 \
  SPRING_PORT=8081
CMD ["/bin/sh", "docker/entrypoint.sh"]
