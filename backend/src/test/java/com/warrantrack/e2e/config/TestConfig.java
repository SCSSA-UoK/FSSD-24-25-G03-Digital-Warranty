package com.warrantrack.e2e.config;

import java.time.Duration;

/**
 * Global configuration parameters for the Selenium E2E test suite.
 * Values can be overridden at runtime via system properties or environment variables:
 * e.g. -De2e.base.url=http://localhost:5173 -De2e.browser=chrome -De2e.headless=true
 */
public class TestConfig {

    public static final String BASE_URL = System.getProperty(
            "e2e.base.url",
            System.getenv().getOrDefault("E2E_BASE_URL", "http://localhost:5173")
    );

    public static final String BROWSER = System.getProperty(
            "e2e.browser",
            System.getenv().getOrDefault("E2E_BROWSER", "chrome")
    ).toLowerCase();

    public static final boolean HEADLESS = Boolean.parseBoolean(
            System.getProperty(
                    "e2e.headless",
                    System.getenv().getOrDefault("E2E_HEADLESS", "true")
            )
    );

    public static final Duration IMPLICIT_WAIT = Duration.ofSeconds(
            Long.parseLong(System.getProperty("e2e.implicit.wait.sec", "5"))
    );

    public static final Duration EXPLICIT_WAIT = Duration.ofSeconds(
            Long.parseLong(System.getProperty("e2e.explicit.wait.sec", "12"))
    );

    private TestConfig() {
        // static constants container
    }
}
