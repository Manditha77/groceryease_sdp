package com.uok.groceryease_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class GroceryeaseBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(GroceryeaseBackendApplication.class, args);
	}

}
