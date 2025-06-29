package com.uok.groceryease_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NotificationScheduler {

    @Autowired
    private LoanNotificationService loanNotificationService;

    // Run every hour
    @Scheduled(fixedRate = 3600000)
    public void processNotifications() {
        loanNotificationService.processNotifications();
    }
}