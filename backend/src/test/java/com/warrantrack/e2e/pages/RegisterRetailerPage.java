package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for Retailer Registration ("/register/retailer").
 */
public class RegisterRetailerPage extends BasePage {

    private final By businessNameInput = By.cssSelector("input[name='businessName']");
    private final By regNumInput = By.cssSelector("input[name='registrationNumber']");
    private final By contactNameInput = By.cssSelector("input[name='name']");
    private final By emailInput = By.cssSelector("input[name='contactEmail']");
    private final By passwordInput = By.cssSelector("input[name='password']");
    private final By confirmPasswordInput = By.cssSelector("input[name='confirmPassword']");
    private final By phoneInput = By.cssSelector("input[name='contactPhone']");
    private final By addressInput = By.cssSelector("input[name='address']");
    private final By submitBtn = By.cssSelector("button[type='submit']");
    private final By successAlert = By.xpath("//div[contains(@class, 'bg-emerald-50')]");
    private final By errorAlert = By.xpath("//div[contains(@class, 'bg-red-50') or contains(@class, 'bg-rose-50')]");

    public RegisterRetailerPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementDisplayed(businessNameInput);
    }

    public void fillRetailerForm(String businessName, String regNum, String contactName,
                                 String email, String password, String confirmPassword,
                                 String phone, String address) {
        type(businessNameInput, businessName);
        type(regNumInput, regNum);
        type(contactNameInput, contactName);
        type(emailInput, email);
        type(passwordInput, password);
        type(confirmPasswordInput, confirmPassword);
        type(phoneInput, phone);
        type(addressInput, address);
    }

    public void clickSubmit() {
        click(submitBtn);
    }

    public boolean isSuccessDisplayed() {
        return isElementDisplayed(successAlert);
    }

    public boolean isErrorDisplayed() {
        return isElementDisplayed(errorAlert);
    }
}
