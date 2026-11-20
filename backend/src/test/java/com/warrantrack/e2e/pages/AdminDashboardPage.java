package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for Admin Platform Dashboard ("/admin").
 */
public class AdminDashboardPage extends BasePage {

    private final By retailersNavLink = By.xpath("//a[contains(@href, '/admin/retailers')]");
    private final By customersNavLink = By.xpath("//a[contains(@href, '/admin/customers')]");
    private final By claimsNavLink = By.xpath("//a[contains(@href, '/admin/claims')]");
    private final By auditLogsNavLink = By.xpath("//a[contains(@href, '/admin/audit-logs')]");

    public AdminDashboardPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return getCurrentUrl().contains("/admin");
    }

    public void navigateToRetailers() {
        click(retailersNavLink);
    }

    public void navigateToCustomers() {
        click(customersNavLink);
    }

    public void navigateToClaims() {
        click(claimsNavLink);
    }

    public void navigateToAuditLogs() {
        click(auditLogsNavLink);
    }
}
