package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for Customer Registration ("/register").
 */
public class RegisterCustomerPage extends BasePage {

    private final By nameInput = By.xpath("//label[contains(text(), 'Full Name')]/following-sibling::input | //input[@placeholder='John Doe']");
    private final By emailInput = By.xpath("//label[contains(text(), 'Email Address')]/following-sibling::input | //input[@type='email']");
    private final By phoneInput = By.xpath("//label[contains(text(), 'Phone')]/following-sibling::input | //input[@type='tel']");
    private final By passwordInput = By.xpath("//label[contains(text(), 'Create Password')]/following-sibling::div//input | //label[contains(text(), 'Create Password')]/..//input");
    private final By confirmPasswordInput = By.xpath("//label[contains(text(), 'Confirm Password')]/following-sibling::div//input | //label[contains(text(), 'Confirm Password')]/..//input");
    private final By submitBtn = By.cssSelector("button[type='submit']");
    private final By successAlert = By.xpath("//div[contains(@class, 'bg-emerald-50')]");
    private final By errorAlert = By.xpath("//div[contains(@class, 'bg-red-50') or contains(@class, 'bg-rose-50')]");

    public RegisterCustomerPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementDisplayed(nameInput) && isElementDisplayed(emailInput);
    }

    public void fillForm(String name, String email, String phone, String password, String confirmPassword) {
        type(nameInput, name);
        type(emailInput, email);
        type(phoneInput, phone);
        type(passwordInput, password);
        type(confirmPasswordInput, confirmPassword);
    }

    public void clickSubmit() {
        click(submitBtn);
    }

    public boolean isSuccessDisplayed() {
        return isElementDisplayed(successAlert);
    }

    public String getSuccessMessage() {
        return getText(successAlert);
    }

    public boolean isErrorDisplayed() {
        return isElementDisplayed(errorAlert);
    }

    public String getErrorMessage() {
        return getText(errorAlert);
    }
}
