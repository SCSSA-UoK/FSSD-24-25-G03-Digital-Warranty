package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for Customer Portal Dashboard ("/customer").
 */
public class CustomerDashboardPage extends BasePage {

    private final By warrantiesNavLink = By.xpath("//a[contains(@href, '/customer/warranties')]");
    private final By claimsNavLink = By.xpath("//a[contains(@href, '/customer/claims')]");
    private final By findPurchasesLink = By.xpath("//a[contains(@href, '/customer/find-purchases')]");
    private final By profileLink = By.xpath("//a[contains(@href, '/customer/profile')]");
    private final By logoutBtn = By.xpath("//button[contains(@title, 'Logout') or contains(text(), 'Logout') or @aria-label='Logout'] | //nav//button[contains(@class, 'cursor-pointer')]");

    public CustomerDashboardPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementDisplayed(warrantiesNavLink) || getCurrentUrl().contains("/customer");
    }

    public void navigateToWarranties() {
        click(warrantiesNavLink);
    }

    public void navigateToClaims() {
        click(claimsNavLink);
    }

    public void navigateToFindPurchases() {
        click(findPurchasesLink);
    }

    public void navigateToProfile() {
        click(profileLink);
    }
}
