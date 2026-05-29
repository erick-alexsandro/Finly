package com.smilecorp.api.bdd;

import com.smilecorp.api.util.TenantContext;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;

public class CommonSteps {

    @Before
    public void setUp() {
        TenantContext.clear();
    }

    @After
    public void tearDown() {
        TenantContext.clear();
    }

    @Given("que o ID da organização é {string}")
    public void setOrganizationId(String orgId) {
        TenantContext.setOrganizationId(orgId);
    }
}
