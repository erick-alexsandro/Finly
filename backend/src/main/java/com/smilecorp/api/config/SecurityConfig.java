package com.smilecorp.api.config;

import com.smilecorp.api.security.NeonAuthTokenValidator;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.util.TenantContext;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

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

    private final NeonAuthTokenValidator neonAuthTokenValidator;

    private boolean isDevMode() {
        String devMode = System.getenv("DEV_MODE");
        if ("true".equalsIgnoreCase(devMode)) return true;
        devMode = System.getProperty("DEV_MODE");
        if ("true".equalsIgnoreCase(devMode)) return true;

        String dbUrl = System.getenv("DATABASE_URL");
        if (dbUrl == null) {
            dbUrl = System.getProperty("spring.datasource.url", "jdbc:h2:mem:smilecorp");
        }
        return dbUrl != null && (dbUrl.contains("h2:mem") || dbUrl.contains("h2:tcp"));
    }

    public SecurityConfig(NeonAuthTokenValidator neonAuthTokenValidator) {
        this.neonAuthTokenValidator = neonAuthTokenValidator;
    }

    /**
     * JWT Filter that validates Neon Auth tokens and sets organization context.
     * In dev mode (H2), skips JWT validation for testing.
     * In prod mode (Neon), validates JWT and uses org ID from claims or header.
     */
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

                String authHeader = request.getHeader("Authorization");

                if (isDevMode()) {
                    // Development mode (H2): Skip JWT validation, use org ID from header
                    String organizationId = request.getHeader("X-Organization-Id");
                    if (organizationId == null) {
                        organizationId = "6fd8b547-393d-4a2c-986b-31fbf998a4b9"; // Fallback - same org used in DataInitializerConfig
                    }

                    String userId = request.getHeader("X-User-Id");
                    if (userId == null) {
                        userId = "user-dev-test";
                    }

                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                    authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

                    NeonAuthToken authentication = new NeonAuthToken(userId, organizationId, authorities);
                    authentication.setToken("dev-mode-token");

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("[DEV MODE] User: {} | Org: {}", userId, organizationId);
                } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    // Production mode (Neon): Validate JWT
                    String token = authHeader.substring(7);

                    try {
                        Claims claims = neonAuthTokenValidator.validateToken(token);

                        String userId = neonAuthTokenValidator.extractUserId(claims);
                        String organizationId = request.getHeader("X-Organization-Id");

                        if (organizationId == null) {
                            organizationId = neonAuthTokenValidator.extractOrganizationId(claims);
                        }

                        if (organizationId == null) {
                            log.warn("No organization ID found for user: {}", userId);
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.getWriter().write("{\"error\": \"No organization assigned\"}");
                            return;
                        }

                        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

                        NeonAuthToken authentication = new NeonAuthToken(userId, organizationId, authorities);
                        authentication.setToken(token);

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        log.debug("Token validated for user: {} in organization: {}", userId, organizationId);
                    } catch (JwtException e) {
                        log.error("Invalid JWT token: {}", e.getMessage());
                        response.setStatus(HttpStatus.UNAUTHORIZED.value());
                        response.getWriter().write("{\"error\": \"Invalid token\"}");
                        return;
                    }
                } else if (!isPublicEndpoint(request.getRequestURI())) {
                    log.warn("Missing or invalid Authorization header for protected endpoint: {}", request.getRequestURI());
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.getWriter().write("{\"error\": \"Missing Authorization header\"}");
                    return;
                }

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
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
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
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
    
}
