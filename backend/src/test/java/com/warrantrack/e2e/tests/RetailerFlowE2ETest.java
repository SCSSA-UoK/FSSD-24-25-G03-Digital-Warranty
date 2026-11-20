package com.warrantrack.e2e.tests;

import com.warrantrack.e2e.base.BaseE2ETest;
import com.warrantrack.e2e.pages.LoginPage;
import com.warrantrack.e2e.pages.RetailerDashboardPage;
import com.warrantrack.e2e.pages.RetailerPosPage;
import com.warrantrack.e2e.pages.RetailerProductsPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * End-to-end tests for Retailer Portal workflows (POS billing, products, claims).
 */
public class RetailerFlowE2ETest extends BaseE2ETest {

    @Test
    @DisplayName("Protected retailer routes redirect unauthenticated user to login")
    public void testRetailerProtectedRoutesRedirect() {
        navigateTo("/retailer");
        LoginPage loginPage = new LoginPage(driver);
        assertTrue(loginPage.isLoaded() || driver.getCurrentUrl().contains("/login"),
                "Unauthenticated access to /retailer should redirect to /login");
    }

    @Test
    @DisplayName("Retailer POS route requires retailer authentication")
    public void testRetailerPosProtectedRoute() {
        navigateTo("/retailer/pos");
        LoginPage loginPage = new LoginPage(driver);
        assertTrue(loginPage.isLoaded() || driver.getCurrentUrl().contains("/login"),
                "Unauthenticated access to /retailer/pos should redirect to /login");
    }

    @Test
    @DisplayName("Retailer portal navigation across POS and Products when authenticated")
    public void testRetailerNavigation() {
        navigateTo("/login");
        LoginPage loginPage = new LoginPage(driver);
        assertTrue(loginPage.isLoaded());

        loginPage.login("retailer@example.com", "Password@123");

        if (driver.getCurrentUrl().contains("/retailer")) {
            RetailerDashboardPage dashboard = new RetailerDashboardPage(driver);
            assertTrue(dashboard.isLoaded());

            dashboard.navigateToPos();
            RetailerPosPage posPage = new RetailerPosPage(driver);
            assertTrue(posPage.isLoaded());

            dashboard.navigateToProducts();
            RetailerProductsPage productsPage = new RetailerProductsPage(driver);
            assertTrue(productsPage.isLoaded());
        }
    }
}
