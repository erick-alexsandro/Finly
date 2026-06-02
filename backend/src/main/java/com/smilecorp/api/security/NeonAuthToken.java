package com.smilecorp.api.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

/**
 * Custom Authentication token for Neon Auth JWT.
 */
public class NeonAuthToken implements Authentication {
    private String token;
    private String userId;
    private String organizationId;
    private Collection<? extends GrantedAuthority> authorities;
    private boolean authenticated;

    public NeonAuthToken(String token) {
        this.token = token;
        this.authenticated = false;
    }

    public NeonAuthToken(String userId, String organizationId, Collection<? extends GrantedAuthority> authorities) {
        this.userId = userId;
        this.organizationId = organizationId;
        this.authorities = authorities;
        this.authenticated = true;
    }

    @Override
    public String getName() {
        return userId;
    }

    @Override
    public Object getCredentials() {
        return token;
    }

    @Override
    public Object getPrincipal() {
        return userId;
    }

    @Override
    public Object getDetails() {
        return organizationId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    public void setAuthorities(Collection<? extends GrantedAuthority> authorities) {
        this.authorities = authorities;
    }

    @Override
    public boolean isAuthenticated() {
        return authenticated;
    }

    @Override
    public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
        this.authenticated = isAuthenticated;
    }
}
