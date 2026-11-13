# =====================================================================
# ETAPA 1: Compilar el Frontend Vue 3 PWA (Genera Service Worker y UI)
# =====================================================================
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Vite compila hacia ../src/main/resources/static
RUN mkdir -p /app/src/main/resources/static && npm run build

# =====================================================================
# ETAPA 2: Compilar el Backend Java Spring Boot con el PWA embebido
# =====================================================================
FROM maven:3.9.9-eclipse-temurin-17 AS backend-build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
# Copiamos los archivos estáticos compilados de Vue PWA dentro de Spring Boot
COPY --from=frontend-build /app/src/main/resources/static ./src/main/resources/static
RUN mvn clean package -DskipTests

# =====================================================================
# ETAPA 3: Imagen ligera de Producción (Java 17 JRE)
# =====================================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/target/finanzy-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
