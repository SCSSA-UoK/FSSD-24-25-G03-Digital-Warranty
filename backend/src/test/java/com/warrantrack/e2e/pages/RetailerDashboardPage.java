package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for Retailer Portal Dashboard ("/retailer").
 */
public class RetailerDashboardPage extends BasePage {

    private final By posNavLink = By.xpath("//a[contains(@href, '/retailer/pos')]");
    private final By productsNavLink = By.xpath("//a[contains(@href, '/retailer/products')]");
    private final By claimsNavLink = By.xpath("//a[contains(@href, '/retailer/claims')]");
    private final By profileNavLink = By.xpath("//a[contains(@href, '/retailer/profile')]");

    public RetailerDashboardPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return getCurrentUrl().contains("/retailer");
    }

    public void navigateToPos() {
        click(posNavLink);
    }

    public void navigateToProducts() {
        click(productsNavLink);
    }

    public void navigateToClaims() {
        click(claimsNavLink);
    }

    public void navigateToProfile() {
        click(profileNavLink);
    }
}
