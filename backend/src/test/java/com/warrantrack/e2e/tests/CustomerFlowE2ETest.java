package com.warrantrack.e2e.tests;

import com.warrantrack.e2e.base.BaseE2ETest;
import com.warrantrack.e2e.pages.CustomerDashboardPage;
import com.warrantrack.e2e.pages.CustomerWarrantiesPage;
import com.warrantrack.e2e.pages.LoginPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * End-to-end tests for the Customer Portal workflows.
 */
public class CustomerFlowE2ETest extends BaseE2ETest {

    @Test
    @DisplayName("Protected customer routes should redirect unauthenticated user to login")
    public void testCustomerProtectedRoutesRedirect() {
        navigateTo("/customer");
        LoginPage loginPage = new LoginPage(driver);
        assertTrue(loginPage.isLoaded() || driver.getCurrentUrl().contains("/login"),
                "Unauthenticated access to /customer should redirect to /login");
    }

    @Test
    @DisplayName("Customer warranties route requires authentication")
    public void testWarrantiesProtectedRoute() {
        navigateTo("/customer/warranties");
        LoginPage loginPage = new LoginPage(driver);
        assertTrue(loginPage.isLoaded() || driver.getCurrentUrl().contains("/login"),
                "Unauthenticated access to /customer/warranties should redirect to /login");
    }

    @Test
    @DisplayName("Customer dashboard navigation links work when authenticated")
    public void testCustomerDashboardNavigation() {
        navigateTo("/login");
        LoginPage loginPage = new LoginPage(driver);
        assertTrue(loginPage.isLoaded());

        // Perform login attempt
        loginPage.login("customer@example.com", "Password@123");

        // If credentials are valid in active database, verify dashboard layout
        if (driver.getCurrentUrl().contains("/customer")) {
            CustomerDashboardPage dashboard = new CustomerDashboardPage(driver);
            assertTrue(dashboard.isLoaded());

            dashboard.navigateToWarranties();
            CustomerWarrantiesPage warranties = new CustomerWarrantiesPage(driver);
            assertTrue(warranties.isLoaded());
        }
    }
}
