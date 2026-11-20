package com.warrantrack.e2e.base;

import com.warrantrack.e2e.config.TestConfig;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Base class for all Selenium E2E tests.
 * Manages browser initialization, options, explicit wait instance, and clean teardown.
 */
@Tag("e2e")
public abstract class BaseE2ETest {

    protected WebDriver driver;
    protected WebDriverWait wait;

    @BeforeEach
    public void setUp() {
        this.driver = createWebDriver();
        this.driver.manage().timeouts().implicitlyWait(TestConfig.IMPLICIT_WAIT);
        this.driver.manage().window().setSize(new Dimension(1440, 900));
        this.wait = new WebDriverWait(driver, TestConfig.EXPLICIT_WAIT);
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            try {
                driver.quit();
            } catch (Exception ignored) {
            }
        }
    }

    protected WebDriver createWebDriver() {
        String browser = TestConfig.BROWSER;
        if ("edge".equalsIgnoreCase(browser)) {
            EdgeOptions options = new EdgeOptions();
            if (TestConfig.HEADLESS) {
                options.addArguments("--headless=new");
            }
            options.addArguments("--disable-gpu");
            options.addArguments("--no-sandbox");
            options.addArguments("--disable-dev-shm-usage");
            options.addArguments("--window-size=1440,900");
            return new EdgeDriver(options);
        } else {
            ChromeOptions options = new ChromeOptions();
            if (TestConfig.HEADLESS) {
                options.addArguments("--headless=new");
            }
            options.addArguments("--disable-gpu");
            options.addArguments("--no-sandbox");
            options.addArguments("--disable-dev-shm-usage");
            options.addArguments("--remote-allow-origins=*");
            options.addArguments("--window-size=1440,900");
            return new ChromeDriver(options);
        }
    }

    /**
     * Navigates to a path relative to the configured frontend baseUrl.
     */
    protected void navigateTo(String path) {
        String url = TestConfig.BASE_URL;
        if (!url.endsWith("/") && !path.startsWith("/")) {
            url += "/" + path;
        } else if (url.endsWith("/") && path.startsWith("/")) {
            url += path.substring(1);
        } else {
            url += path;
        }
        driver.get(url);
    }
}
