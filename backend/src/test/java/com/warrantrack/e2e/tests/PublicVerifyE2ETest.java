package com.warrantrack.e2e.tests;

import com.warrantrack.e2e.base.BaseE2ETest;
import com.warrantrack.e2e.pages.PublicVerifyPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * End-to-end tests for the Public QR Warranty Verification Certificate screen.
 */
public class PublicVerifyE2ETest extends BaseE2ETest {

    @Test
    @DisplayName("Public verify route loads verification certificate layout")
    public void testPublicVerifyLoads() {
        navigateTo("/verify/test-qr-token-12345");
        PublicVerifyPage verifyPage = new PublicVerifyPage(driver);

        assertTrue(verifyPage.isLoaded(), "Public verify URL should load certificate page");
    }
}
