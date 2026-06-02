package com.smilecorp.api.util;

/**
 * Context holder for multi-tenant organization information.
 * Uses ThreadLocal to store organization ID per request.
 */
public class TenantContext {
    private static final ThreadLocal<String> organizationId = new ThreadLocal<>();

    public static void setOrganizationId(String orgId) {
        organizationId.set(orgId);
    }

    public static String getOrganizationId() {
        return organizationId.get();
    }

    public static void clear() {
        organizationId.remove();
    }
}
