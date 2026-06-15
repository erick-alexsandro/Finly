package com.smilecorp.api.config;

import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    public SecurityConfig() {
    }

    public class NeonAuthTokenAuthenticationFilter extends OncePerRequestFilter {
        private static final Logger log = LoggerFactory.getLogger(NeonAuthTokenAuthenticationFilter.class);
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                throws ServletException, IOException {
            try {
                if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                    filterChain.doFilter(request, response);
                    return;
                }

                String organizationId = request.getHeader("X-Organization-Id");

                if (organizationId == null || organizationId.isBlank()) {
                    if (isPublicEndpoint(request.getRequestURI())) {
                        filterChain.doFilter(request, response);
                        return;
                    }
                    log.warn("Missing X-Organization-Id header for: {}", request.getRequestURI());
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.getWriter().write("{\"error\": \"Organization ID required (X-Organization-Id header)\"}");
                    return;
                }

                String userId = request.getHeader("X-User-Id");
                if (userId == null || userId.isBlank()) {
                    userId = "user-default";
                }

                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

                NeonAuthToken authentication = new NeonAuthToken(userId, organizationId, authorities);
                authentication.setToken("trusted-header");

                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("Auth via header - User: {} | Org: {}", userId, organizationId);

                filterChain.doFilter(request, response);
            } finally {
                TenantContext.clear();
            }
        }

        private boolean isPublicEndpoint(String uri) {
            List<String> publicEndpoints = Arrays.asList(
                    "/actuator",
                    "/health",
                    "/swagger-ui",
                    "/v3/api-docs"
            );
            return publicEndpoints.stream().anyMatch(uri::startsWith);
        }
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var origins = new java.util.ArrayList<String>();
        origins.add("http://localhost:3000");
        var frontendUrl = System.getenv("FRONTEND_URL");
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            origins.add(frontendUrl);
        }
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors().and()
                .csrf().disable()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers("/actuator/**", "/health").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(new NeonAuthTokenAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling()
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"" + authException.getMessage() + "\"}");
                });

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
