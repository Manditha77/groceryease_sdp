package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DAO.LoanNotificationRepository;
import com.uok.groceryease_backend.entity.LoanNotification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LoanNotificationService {

    @Autowired
    private LoanNotificationRepository loanNotificationRepository;

    public List<LoanNotification> getPendingNotifications() {
        return loanNotificationRepository.findAll().stream()
                .filter(notification -> "PENDING".equals(notification.getStatus()))
                .toList();
    }

    public void processNotifications() {
        List<LoanNotification> notifications = getPendingNotifications();
        for (LoanNotification notification : notifications) {
            try {
                if ("EMAIL".equals(notification.getNotificationMethod())) {
                    // Simulate sending email (replace with actual email service integration)
                    System.out.println("Sending email to " + notification.getUser().getEmail() +
                            " for order " + notification.getOrder().getOrderId() +
                            " with due amount " + notification.getDueAmount());
                } else {
                    // Simulate phone notification (replace with actual phone/SMS service integration)
                    System.out.println("Calling " + notification.getUser().getPhoneNo() +
                            " for order " + notification.getOrder().getOrderId() +
                            " with due amount " + notification.getDueAmount());
                }
                notification.setStatus("SENT");
            } catch (Exception e) {
                notification.setStatus("FAILED");
                System.err.println("Failed to send notification: " + e.getMessage());
            }
            loanNotificationRepository.save(notification);
        }
    }
}