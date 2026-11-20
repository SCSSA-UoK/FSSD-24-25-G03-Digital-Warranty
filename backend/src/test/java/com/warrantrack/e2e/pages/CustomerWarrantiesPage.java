package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for Customer Digital Warranties page ("/customer/warranties").
 */
public class CustomerWarrantiesPage extends BasePage {

    private final By heading = By.xpath("//h1[contains(text(), 'Digital Warranties') or contains(text(), 'Warranties')] | //h2[contains(text(), 'Warranties')]");
    private final By searchInput = By.xpath("//input[contains(@placeholder, 'Search') or contains(@placeholder, 'serial') or contains(@placeholder, 'product')]");
    private final By warrantyCards = By.xpath("//div[contains(@class, 'rounded-2xl') and .//h3]");
    private final By qrCodeBtn = By.xpath("//button[contains(@title, 'QR') or contains(@title, 'Passport')]");
    private final By qrModal = By.xpath("//div[contains(@class, 'fixed')]//h3[contains(text(), 'Passport') or contains(text(), 'QR')]");
    private final By fileClaimBtn = By.xpath("//a[contains(@href, '/customer/submit-claim')] | //button[contains(text(), 'File Claim')]");

    public CustomerWarrantiesPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return getCurrentUrl().contains("/customer/warranties");
    }

    public void searchWarranty(String query) {
        if (isElementPresent(searchInput)) {
            type(searchInput, query);
        }
    }

    public int getWarrantyCardCount() {
        return driver.findElements(warrantyCards).size();
    }

    public void openFirstQrModal() {
        if (isElementPresent(qrCodeBtn)) {
            click(qrCodeBtn);
        }
    }

    public boolean isQrModalOpen() {
        return isElementDisplayed(qrModal);
    }
}
