package com.smilecorp.api.dto;

import java.util.List;

public class JwtTokenPayload {
    private String sub;  // user ID
    private String email;
    private String name;
    private String iat;  // issued at
    private String exp;  // expiration
    private List<String> organizations;  // organization IDs user belongs to
    private String activeOrganizationId;

    public JwtTokenPayload() {
    }

    public JwtTokenPayload(String sub, String email, String name, String iat, String exp, 
                           List<String> organizations, String activeOrganizationId) {
        this.sub = sub;
        this.email = email;
        this.name = name;
        this.iat = iat;
        this.exp = exp;
        this.organizations = organizations;
        this.activeOrganizationId = activeOrganizationId;
    }

    public String getSub() {
        return sub;
    }

    public void setSub(String sub) {
        this.sub = sub;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIat() {
        return iat;
    }

    public void setIat(String iat) {
        this.iat = iat;
    }

    public String getExp() {
        return exp;
    }

    public void setExp(String exp) {
        this.exp = exp;
    }

    public List<String> getOrganizations() {
        return organizations;
    }

    public void setOrganizations(List<String> organizations) {
        this.organizations = organizations;
    }

    public String getActiveOrganizationId() {
        return activeOrganizationId;
    }

    public void setActiveOrganizationId(String activeOrganizationId) {
        this.activeOrganizationId = activeOrganizationId;
    }
}
