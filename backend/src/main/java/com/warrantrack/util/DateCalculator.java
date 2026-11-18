package com.warrantrack.util;

import com.warrantrack.model.enums.WarrantyUnit;

import java.time.LocalDate;

public final class DateCalculator {

    private DateCalculator() {}

    /**
     * Calculates warranty expiry date from a start date, duration, and unit.
     * The expiry date is the last day of the warranty period (inclusive).
     */
    public static LocalDate calculateExpiryDate(LocalDate startDate, int duration, WarrantyUnit unit) {
        return switch (unit) {
            case DAYS -> startDate.plusDays(duration - 1);
            case MONTHS -> startDate.plusMonths(duration).minusDays(1);
            case YEARS -> startDate.plusYears(duration).minusDays(1);
        };
    }

    /**
     * Checks if a warranty is currently within its valid period (inclusive of expiry date).
     */
    public static boolean isWarrantyValid(LocalDate startDate, LocalDate expiryDate) {
        LocalDate today = LocalDate.now();
        return !today.isBefore(startDate) && !today.isAfter(expiryDate);
    }
}

