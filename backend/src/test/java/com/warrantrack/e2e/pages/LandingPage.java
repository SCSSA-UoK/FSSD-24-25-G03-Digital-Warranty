package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for the Public Landing Page ("/").
 */
public class LandingPage extends BasePage {

    private final By heroHeading = By.tagName("h1");
    private final By brandLogo = By.xpath("//span[contains(text(), 'WarranTrack')]");
    private final By createCustomerBtn = By.xpath("//a[contains(@href, '/register') and contains(text(), 'Customer')]");
    private final By retailerRegisterBtn = By.xpath("//a[contains(@href, '/register/retailer')]");
    private final By navLoginBtn = By.xpath("//nav//a[contains(@href, '/login')] | //a[contains(@href, '/login')]");
    private final By themeToggleBtn = By.xpath("//button[contains(@title, 'theme') or contains(@title, 'Theme') or @aria-label='Toggle theme']");
    private final By htmlTag = By.tagName("html");

    public LandingPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementDisplayed(heroHeading);
    }

    public String getHeroTitle() {
        return getText(heroHeading);
    }

    public void clickCreateCustomer() {
        click(createCustomerBtn);
    }

    public void clickRetailerRegister() {
        click(retailerRegisterBtn);
    }

    public void clickLogin() {
        click(navLoginBtn);
    }

    public void toggleTheme() {
        if (isElementPresent(themeToggleBtn)) {
            click(themeToggleBtn);
        }
    }

    public boolean isDarkMode() {
        String htmlClass = driver.findElement(htmlTag).getAttribute("class");
        return htmlClass != null && htmlClass.contains("dark");
    }
}
