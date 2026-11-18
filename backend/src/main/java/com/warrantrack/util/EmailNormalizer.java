package com.warrantrack.util;

public final class EmailNormalizer {

    private EmailNormalizer() {}

    /**
     * Normalizes an email address for consistent storage and comparison.
     * Trims whitespace and converts to lowercase.
     */
    public static String normalize(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
    }
}

