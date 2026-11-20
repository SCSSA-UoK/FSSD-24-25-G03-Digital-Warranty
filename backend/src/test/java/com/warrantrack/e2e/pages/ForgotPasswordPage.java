package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for Forgot Password & OTP Reset flow ("/forgot-password").
 */
public class ForgotPasswordPage extends BasePage {

    private final By emailInput = By.cssSelector("input[type='email']");
    private final By submitBtn = By.cssSelector("button[type='submit']");
    private final By otpInput = By.xpath("//input[contains(@class, 'tracking-') or contains(@placeholder, '••••••')]");
    private final By newPasswordInput = By.xpath("//label[contains(text(), 'New Password')]/following-sibling::div//input | //label[contains(text(), 'New Password')]/..//input");
    private final By confirmPasswordInput = By.xpath("//label[contains(text(), 'Confirm New Password')]/following-sibling::div//input | //label[contains(text(), 'Confirm New Password')]/..//input");
    private final By successBanner = By.xpath("//div[contains(@class, 'bg-emerald-50')]");
    private final By errorBanner = By.xpath("//div[contains(@class, 'bg-rose-50')]");

    public ForgotPasswordPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementDisplayed(emailInput);
    }

    public void requestOtp(String email) {
        type(emailInput, email);
        click(submitBtn);
    }

    public boolean isOtpInputDisplayed() {
        return isElementDisplayed(otpInput);
    }

    public void enterOtpAndVerify(String otp) {
        type(otpInput, otp);
        click(submitBtn);
    }

    public boolean isNewPasswordInputDisplayed() {
        return isElementDisplayed(newPasswordInput);
    }

    public void enterNewPassword(String newPass, String confirmPass) {
        type(newPasswordInput, newPass);
        type(confirmPasswordInput, confirmPass);
        click(submitBtn);
    }

    public boolean isSuccessDisplayed() {
        return isElementDisplayed(successBanner);
    }

    public boolean isErrorDisplayed() {
        return isElementDisplayed(errorBanner);
    }
}
