package com.smilecorp.api.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.SecretKey;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.*;

/**
 * Service to validate JWT tokens from Neon Auth.
 * Fetches JWKS (JSON Web Key Set) from Neon Auth and validates tokens.
 */
@Component
public class NeonAuthTokenValidator {
    private static final Logger log = LoggerFactory.getLogger(NeonAuthTokenValidator.class);

    @Value("${neon.auth.jwks-uri:}")
    private String jwksUri;

    @Value("${neon.auth.base-url:}")
    private String neonAuthBaseUrl;

    private Map<String, String> jwksCache = new HashMap<>();
    private long cacheExpiration = 0;
    private static final long CACHE_DURATION = 3600000; // 1 hour

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public NeonAuthTokenValidator(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Validate JWT token and extract claims.
     */
    public Claims validateToken(String token) throws JwtException {
        try {
            if (jwksUri == null || jwksUri.isEmpty()) {
                throw new JwtException("JWKS URI not configured");
            }

            // Try to validate with cached JWKS first
            Claims claims = validateWithCachedJwks(token);
            if (claims != null) {
                return claims;
            }

            // If cache miss or invalid, fetch fresh JWKS
            Map<String, String> freshJwks = fetchJwks();
            jwksCache = freshJwks;
            cacheExpiration = System.currentTimeMillis() + CACHE_DURATION;

            return validateWithJwks(token, freshJwks);
        } catch (Exception e) {
            log.error("Token validation failed: {}", e.getMessage());
            throw new JwtException("Invalid token: " + e.getMessage(), e);
        }
    }

    private Claims validateWithCachedJwks(String token) {
        if (jwksCache.isEmpty() || System.currentTimeMillis() > cacheExpiration) {
            return null;
        }
        try {
            return validateWithJwks(token, jwksCache);
        } catch (Exception e) {
            log.debug("Cache validation failed, will refresh JWKS");
            return null;
        }
    }

    private Claims validateWithJwks(String token, Map<String, String> jwks) throws Exception {
        String kid = getKeyIdFromToken(token);
        if (kid == null || !jwks.containsKey(kid)) {
            throw new JwtException("Key ID not found in JWKS");
        }

        String publicKeyPem = jwks.get(kid);
        PublicKey publicKey = reconstructPublicKey(publicKeyPem);

        return Jwts.parser()
                .verifyWith((PublicKey) publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Map<String, String> fetchJwks() {
        try {
            log.info("Fetching JWKS from: {}", jwksUri);
            String jwksJson = webClient.get()
                    .uri(jwksUri)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (jwksJson == null || jwksJson.isEmpty()) {
                throw new RuntimeException("Empty JWKS response");
            }

            Map<String, String> jwks = new HashMap<>();
            JsonNode root = objectMapper.readTree(jwksJson);
            JsonNode keys = root.get("keys");

            if (keys != null && keys.isArray()) {
                for (JsonNode key : keys) {
                    String kid = key.get("kid").asText();
                    String x5c = null;

                    if (key.has("x5c") && key.get("x5c").isArray()) {
                        x5c = "-----BEGIN PUBLIC KEY-----\n" +
                              key.get("x5c").get(0).asText() +
                              "\n-----END PUBLIC KEY-----";
                    }

                    if (kid != null && x5c != null) {
                        jwks.put(kid, x5c);
                    }
                }
            }

            log.info("JWKS fetched successfully with {} keys", jwks.size());
            return jwks;
        } catch (Exception e) {
            log.error("Failed to fetch JWKS: {}", e.getMessage());
            throw new RuntimeException("Unable to fetch JWKS", e);
        }
    }

    private String getKeyIdFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) {
                return null;
            }

            String header = new String(Base64.getDecoder().decode(parts[0]));
            JsonNode headerNode = objectMapper.readTree(header);

            if (headerNode.has("kid")) {
                return headerNode.get("kid").asText();
            }
            return null;
        } catch (Exception e) {
            log.debug("Could not extract kid from token header: {}", e.getMessage());
            return null;
        }
    }

    private PublicKey reconstructPublicKey(String pem) throws Exception {
        String publicKeyPem = pem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");

        byte[] decodedKey = Base64.getDecoder().decode(publicKeyPem);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(decodedKey);
        KeyFactory factory = KeyFactory.getInstance("RSA");
        return factory.generatePublic(spec);
    }

    /**
     * Extract organization ID from token claims.
     */
    public String extractOrganizationId(Claims claims) {
        Object orgId = claims.get("organizationId");
        if (orgId != null) {
            return orgId.toString();
        }
        return null;
    }

    /**
     * Extract user ID from token claims.
     */
    public String extractUserId(Claims claims) {
        return claims.getSubject();
    }
}

