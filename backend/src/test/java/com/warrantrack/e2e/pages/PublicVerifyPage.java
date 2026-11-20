package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for Public Warranty Certificate Verification ("/verify/:token").
 */
public class PublicVerifyPage extends BasePage {

    private final By certificateCard = By.xpath("//div[contains(@class, 'rounded-3xl') or contains(@class, 'border-double')]");
    private final By verifiedBadge = By.xpath("//*[contains(text(), 'Valid') or contains(text(), 'Active') or contains(text(), 'Verified')]");
    private final By productName = By.xpath("//h1 | //h2[contains(@class, 'font-bold')]");

    public PublicVerifyPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return getCurrentUrl().contains("/verify/");
    }

    public boolean isCertificateDisplayed() {
        return isElementDisplayed(certificateCard);
    }

    public boolean isVerifiedBadgeDisplayed() {
        return isElementDisplayed(verifiedBadge);
    }
}
