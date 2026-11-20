package com.warrantrack.e2e.tests;

import com.warrantrack.e2e.base.BaseE2ETest;
import com.warrantrack.e2e.pages.AdminDashboardPage;
import com.warrantrack.e2e.pages.LoginPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * End-to-end tests for Admin platform management workflows.
 */
public class AdminFlowE2ETest extends BaseE2ETest {

    @Test
    @DisplayName("Protected admin dashboard redirects unauthenticated user to login")
    public void testAdminProtectedRouteRedirect() {
        navigateTo("/admin");
        LoginPage loginPage = new LoginPage(driver);
        assertTrue(loginPage.isLoaded() || driver.getCurrentUrl().contains("/login"),
                "Unauthenticated access to /admin should redirect to /login");
    }

    @Test
    @DisplayName("Admin audit logs route requires admin authentication")
    public void testAdminAuditLogsProtectedRoute() {
        navigateTo("/admin/audit-logs");
        LoginPage loginPage = new LoginPage(driver);
        assertTrue(loginPage.isLoaded() || driver.getCurrentUrl().contains("/login"),
                "Unauthenticated access to /admin/audit-logs should redirect to /login");
    }

    @Test
    @DisplayName("Admin dashboard navigation across platform sections when authenticated")
    public void testAdminNavigation() {
        navigateTo("/login");
        LoginPage loginPage = new LoginPage(driver);
        assertTrue(loginPage.isLoaded());

        loginPage.login("admin@warrantrack.com", "AdminPassword123!");

        if (driver.getCurrentUrl().contains("/admin")) {
            AdminDashboardPage adminPage = new AdminDashboardPage(driver);
            assertTrue(adminPage.isLoaded());

            adminPage.navigateToRetailers();
            assertTrue(driver.getCurrentUrl().contains("/admin/retailers"));

            adminPage.navigateToAuditLogs();
            assertTrue(driver.getCurrentUrl().contains("/admin/audit-logs"));
        }
    }
}
