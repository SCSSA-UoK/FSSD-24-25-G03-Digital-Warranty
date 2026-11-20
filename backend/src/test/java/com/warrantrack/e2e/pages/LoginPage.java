package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for the Authentication Login Page ("/login").
 */
public class LoginPage extends BasePage {

    private final By emailInput = By.cssSelector("input[type='email']");
    private final By passwordInput = By.cssSelector("input[type='password'], input[name='password']");
    private final By submitBtn = By.cssSelector("button[type='submit']");
    private final By errorBanner = By.xpath("//div[contains(@class, 'bg-red-50') or contains(@class, 'bg-rose-50')]");
    private final By forgotPasswordLink = By.xpath("//a[contains(@href, '/forgot-password')]");
    private final By registerCustomerLink = By.xpath("//a[contains(@href, '/register') and contains(text(), 'Customer')]");
    private final By registerRetailerLink = By.xpath("//a[contains(@href, '/register/retailer')]");
    private final By heading = By.xpath("//h2[contains(text(), 'Sign in to WarranTrack')]");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementDisplayed(emailInput) && isElementDisplayed(submitBtn);
    }

    public void enterEmail(String email) {
        type(emailInput, email);
    }

    public void enterPassword(String password) {
        type(passwordInput, password);
    }

    public void clickSubmit() {
        click(submitBtn);
    }

    public void login(String email, String password) {
        enterEmail(email);
        enterPassword(password);
        clickSubmit();
    }

    public boolean isErrorDisplayed() {
        return isElementDisplayed(errorBanner);
    }

    public String getErrorMessage() {
        return getText(errorBanner);
    }

    public void clickForgotPassword() {
        click(forgotPasswordLink);
    }

    public void clickRegisterCustomer() {
        click(registerCustomerLink);
    }

    public void clickRegisterRetailer() {
        click(registerRetailerLink);
    }
}
