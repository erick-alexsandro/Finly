package com.smilecorp.api.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.smilecorp.api.repository")
@EntityScan(basePackages = "com.smilecorp.api.entity")
public class JpaConfig {
}
