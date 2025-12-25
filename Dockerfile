FROM node:18-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY app.jar /app/app.jar
COPY --from=frontend-build /frontend/build /app/static
VOLUME ["/app/data"]
ENV SPRING_DATASOURCE_URL=jdbc:h2:file:/app/data/salarydb;DB_CLOSE_ON_EXIT=FALSE;AUTO_RECONNECT=TRUE
ENV SPRING_WEB_RESOURCES_STATIC_LOCATIONS=file:/app/static/
EXPOSE 8080
ENTRYPOINT ["sh","-c","exec java -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
