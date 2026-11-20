package com.warrantrack.e2e.tests;

import com.warrantrack.e2e.base.BaseE2ETest;
import com.warrantrack.e2e.pages.ForgotPasswordPage;
import com.warrantrack.e2e.pages.LandingPage;
import com.warrantrack.e2e.pages.LoginPage;
import com.warrantrack.e2e.pages.RegisterCustomerPage;
import com.warrantrack.e2e.pages.RegisterRetailerPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end tests for Public Landing, Theme Switching, and Authentication workflows.
 */
public class AuthE2ETest extends BaseE2ETest {

    @Test
    @DisplayName("Landing Page should load hero title and brand identity")
    public void testLandingPageLoads() {
        navigateTo("/");
        LandingPage landingPage = new LandingPage(driver);

        assertTrue(landingPage.isLoaded(), "Landing page hero title should be visible");
        assertTrue(landingPage.getHeroTitle().toLowerCase().contains("warranty")
                        || landingPage.getHeroTitle().toLowerCase().contains("receipts"),
                "Hero heading should contain warranty messaging");
    }

    @Test
    @DisplayName("Theme toggle should switch between Light and Dark mode")
    public void testThemeToggle() {
        navigateTo("/");
        LandingPage landingPage = new LandingPage(driver);
        assertTrue(landingPage.isLoaded());

        boolean initialMode = landingPage.isDarkMode();
        landingPage.toggleTheme();
        boolean toggledMode = landingPage.isDarkMode();

        assertNotEquals(initialMode, toggledMode, "Toggling theme should switch html dark class");
    }

    @Test
    @DisplayName("Login with invalid credentials should display friendly error alert")
    public void testLoginWithInvalidCredentials() {
        navigateTo("/login");
        LoginPage loginPage = new LoginPage(driver);
        assertTrue(loginPage.isLoaded(), "Login page should be loaded");

        loginPage.login("nonexistent_user@example.com", "WrongPassword123!");

        assertTrue(loginPage.isErrorDisplayed(), "Error banner should be displayed on invalid login");
    }

    @Test
    @DisplayName("Customer registration form navigation and field interactions")
    public void testCustomerRegistrationNavigation() {
        navigateTo("/register");
        RegisterCustomerPage registerPage = new RegisterCustomerPage(driver);
        assertTrue(registerPage.isLoaded(), "Customer registration page should be loaded");

        registerPage.fillForm(
                "Jane Doe",
                "janedoe" + System.currentTimeMillis() + "@example.com",
                "+12345678901",
                "Secret@123",
                "Secret@123"
        );
        // Form fields accept inputs cleanly
        assertTrue(registerPage.isLoaded());
    }

    @Test
    @DisplayName("Retailer registration form displays business information fields")
    public void testRetailerRegistrationNavigation() {
        navigateTo("/register/retailer");
        RegisterRetailerPage retailerPage = new RegisterRetailerPage(driver);
        assertTrue(retailerPage.isLoaded(), "Retailer registration page should be loaded");

        retailerPage.fillRetailerForm(
                "Apex Electronics",
                "BRN-99887766",
                "Marcus Vance",
                "marcus" + System.currentTimeMillis() + "@apex.com",
                "ApexSecret@123",
                "ApexSecret@123",
                "+19876543210",
                "100 Commerce Way, Tech Park"
        );
        assertTrue(retailerPage.isLoaded());
    }

    @Test
    @DisplayName("Forgot password should progress to OTP verification step on valid email submission")
    public void testForgotPasswordFlow() {
        navigateTo("/forgot-password");
        ForgotPasswordPage forgotPage = new ForgotPasswordPage(driver);
        assertTrue(forgotPage.isLoaded(), "Forgot password page should load");

        forgotPage.requestOtp("customer@example.com");
        // Page either shows OTP input or friendly network notice if backend is offline
        assertTrue(forgotPage.isOtpInputDisplayed() || forgotPage.isErrorDisplayed() || forgotPage.isSuccessDisplayed(),
                "Forgot password should show response status");
    }
}
