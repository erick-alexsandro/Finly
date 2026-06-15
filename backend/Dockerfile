FROM maven:3.9-eclipse-temurin-20 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

FROM eclipse-temurin:20-jre
WORKDIR /app
COPY --from=build /app/target/smilecorp-backend-0.1.0.jar app.jar
EXPOSE 8080
CMD java -jar app.jar --spring.profiles.active=prod --server.port=${PORT:-8080}
