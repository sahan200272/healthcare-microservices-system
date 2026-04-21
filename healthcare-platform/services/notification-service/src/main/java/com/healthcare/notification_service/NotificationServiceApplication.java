package com.healthcare.notification_service;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
public class NotificationServiceApplication {

	public static void main(String[] args) {

		// Load .env file first - try multiple locations
		Path[] envPaths = {
				Paths.get(".env"),
				Paths.get("src/main/resources/.env"),
				Paths.get("healthcare-platform/services/notification-service/.env"),
				Paths.get("healthcare-platform/services/notification-service/src/main/resources/.env")
		};

		Dotenv dotenv = null;
		for (Path envPath : envPaths) {
			try {
				if (Files.exists(envPath)) {
					System.out.println("Loading .env from: " + envPath.toAbsolutePath());
					dotenv = Dotenv.configure()
							.directory(envPath.getParent().toAbsolutePath().toString())
							.filename(envPath.getFileName().toString())
							.ignoreIfMissing()
							.load();

					if (!dotenv.entries().isEmpty()) {
						break;
					}
				}
			} catch (Exception e) {
				// Continue to next path
			}
		}

		// Load environment variables into system properties
		if (dotenv != null && !dotenv.entries().isEmpty()) {
			dotenv.entries().forEach(entry -> {
				System.setProperty(entry.getKey(), entry.getValue());
				System.out.println("Loaded env var: " + entry.getKey() + " = "
						+ (entry.getKey().contains("MONGO") ? "***" : entry.getValue()));
			});
		} else {
			System.out.println(
					"Warning: No .env file found. Relying on system environment variables or application.properties defaults.");
		}

		SpringApplication.run(NotificationServiceApplication.class, args);
	}

}
