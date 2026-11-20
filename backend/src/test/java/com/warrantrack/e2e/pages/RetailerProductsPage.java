package com.warrantrack.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for Retailer Product Catalog Management ("/retailer/products").
 */
public class RetailerProductsPage extends BasePage {

    private final By addProductBtn = By.xpath("//button[contains(text(), 'Add Product') or contains(text(), 'New Product')]");
    private final By searchInput = By.xpath("//input[contains(@placeholder, 'Search catalog') or contains(@placeholder, 'product')]");
    private final By nameInput = By.xpath("//input[@name='name' or @placeholder='Product Name']");
    private final By brandInput = By.xpath("//input[@name='brand' or @placeholder='Brand']");
    private final By modelInput = By.xpath("//input[@name='model' or @placeholder='Model']");
    private final By priceInput = By.xpath("//input[@name='basePrice' or @type='number']");
    private final By saveBtn = By.xpath("//button[contains(text(), 'Save') or contains(text(), 'Create') or contains(text(), 'Add')]");

    public RetailerProductsPage(WebDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return getCurrentUrl().contains("/retailer/products");
    }

    public void clickAddProduct() {
        click(addProductBtn);
    }

    public void fillProductDetails(String name, String brand, String model, String price) {
        if (isElementPresent(nameInput)) type(nameInput, name);
        if (isElementPresent(brandInput)) type(brandInput, brand);
        if (isElementPresent(modelInput)) type(modelInput, model);
        if (isElementPresent(priceInput)) type(priceInput, price);
    }

    public void clickSave() {
        click(saveBtn);
    }
}
