package com.warrantrack.service;

import com.warrantrack.model.Warranty;
import com.warrantrack.model.enums.NotificationType;
import com.warrantrack.repository.WarrantyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class WarrantyReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(WarrantyReminderScheduler.class);

    private final WarrantyRepository warrantyRepository;
    private final NotificationService notificationService;

    public WarrantyReminderScheduler(WarrantyRepository warrantyRepository,
                                     NotificationService notificationService) {
        this.warrantyRepository = warrantyRepository;
        this.notificationService = notificationService;
    }

    /**
     * Runs daily at 9:00 AM to notify customers about warranties expiring within the next 7 days.
     */
    @Scheduled(cron = "${app.warranty.reminder-cron:0 0 9 * * ?}")
    public void sendWarrantyExpiryReminders() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysOut = today.plusDays(7);

        log.info("Running daily scheduled warranty expiry check between {} and {}", today, sevenDaysOut);

        List<Warranty> expiringWarranties = warrantyRepository
                .findByExpiryDateBetweenAndCustomerIdIsNotNull(today, sevenDaysOut);

        int remindersSent = 0;
        for (Warranty warranty : expiringWarranties) {
            try {
                notificationService.sendNotification(
                        warranty.getCustomerId(),
                        NotificationType.CLAIM_STATUS_CHANGED,
                        String.format("Warranty Expiry Notice: Your warranty for '%s' expires on %s. Ensure any pending claims are submitted before this date.",
                                warranty.getProductName(), warranty.getExpiryDate()),
                        warranty.getId(),
                        "Warranty"
                );
                remindersSent++;
            } catch (Exception ex) {
                log.warn("Failed to dispatch expiry reminder for warranty ID {}: {}", warranty.getId(), ex.getMessage());
            }
        }

        log.info("Finished warranty expiry check: {} reminders dispatched.", remindersSent);
    }
}

