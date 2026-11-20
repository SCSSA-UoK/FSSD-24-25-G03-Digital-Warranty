package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for Retailer POS Billing & Warranty Issuance ("/retailer/pos").
 */
public class RetailerPosPage extends BasePage {

    private final By customerLookupInput = By.xpath("//input[contains(@placeholder, 'Search existing customer') or contains(@placeholder, 'phone')]");
    private final By newCustomerNameInput = By.xpath("//input[@placeholder='Customer Full Name'] | //label[contains(text(), 'Customer Name')]/following-sibling::input");
    private final By newCustomerPhoneInput = By.xpath("//input[@placeholder='Phone Number'] | //label[contains(text(), 'Phone')]/following-sibling::input");
    private final By productSearchInput = By.xpath("//input[contains(@placeholder, 'Search catalog') or contains(@placeholder, 'product')]");
    private final By productCards = By.xpath("//div[contains(@class, 'cursor-pointer') and .//h4]");
    private final By checkoutBtn = By.xpath("//button[contains(text(), 'Issue Warranty') or contains(text(), 'Complete') or contains(text(), 'Checkout')]");
    private final By invoiceModal = By.xpath("//div[contains(@class, 'fixed')]//h2[contains(text(), 'Tax Invoice') or contains(text(), 'Receipt') or contains(text(), 'Warranty')]");

    public RetailerPosPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return getCurrentUrl().contains("/retailer/pos");
    }

    public void searchAndSelectProduct(String productName) {
        if (isElementPresent(productSearchInput)) {
            type(productSearchInput, productName);
        }
    }

    public void enterCustomerDetails(String name, String phone) {
        if (isElementPresent(newCustomerNameInput)) {
            type(newCustomerNameInput, name);
        }
        if (isElementPresent(newCustomerPhoneInput)) {
            type(newCustomerPhoneInput, phone);
        }
    }

    public boolean isInvoiceModalDisplayed() {
        return isElementDisplayed(invoiceModal);
    }
}
