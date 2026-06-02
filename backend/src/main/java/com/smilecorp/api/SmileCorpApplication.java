package com.smilecorp.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmileCorpApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmileCorpApplication.class, args);
    }
}
