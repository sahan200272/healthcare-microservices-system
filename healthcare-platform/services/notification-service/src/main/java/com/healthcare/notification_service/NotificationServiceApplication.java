package com.healthcare.notification_service;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NotificationServiceApplication {

	public static void main(String[] args) {

		// Load .env file first
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

		dotenv.entries().forEach(entry ->
				System.setProperty(entry.getKey(), entry.getValue())
		);

		SpringApplication.run(NotificationServiceApplication.class, args);
	}

}
