package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DAO.LoanNotificationRepository;
import com.uok.groceryease_backend.DAO.OrderRepository;
import com.uok.groceryease_backend.entity.LoanNotification;
import com.uok.groceryease_backend.entity.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LoanNotificationService {

    @Autowired
    private LoanNotificationRepository loanNotificationRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private JavaMailSender mailSender;

    public List<LoanNotification> getPendingNotifications() {
        return loanNotificationRepository.findAll().stream()
                .filter(notification -> "PENDING".equals(notification.getStatus()))
                .toList();
    }

    @Transactional
    public void processNotifications() {
        List<LoanNotification> notifications = getPendingNotifications();
        for (LoanNotification notification : notifications) {
            try {
                if ("EMAIL".equals(notification.getNotificationMethod())) {
                    sendEmailNotification(notification);
                } else {
                    // Simulate phone notification (replace with actual phone/SMS service integration if needed)
                    System.out.println("Calling " + notification.getUser().getPhoneNo() +
                            " for order " + notification.getOrder().getOrderId() +
                            " with due amount " + notification.getDueAmount());
                    notification.setStatus("SENT");
                }
            } catch (Exception e) {
                notification.setStatus("FAILED");
                System.err.println("Failed to send notification for order " + notification.getOrder().getOrderId() +
                        ": " + e.getMessage());
            }
            loanNotificationRepository.save(notification);
        }
    }

    @Transactional
    public void createAndSendNotification(Long orderId) throws Exception {
        // Check for recent notifications (within the last hour)
        List<LoanNotification> recentNotifications = loanNotificationRepository.findByOrderOrderIdAndNotificationDateAfter(
                orderId, LocalDateTime.now().minusHours(1));
        if (!recentNotifications.isEmpty()) {
            throw new Exception("A notification was already sent for Order ID: " + orderId + " within the last hour");
        }

        // Fetch the order
        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        if (!optionalOrder.isPresent()) {
            throw new Exception("Order not found with ID: " + orderId);
        }
        Order order = optionalOrder.get();

        // Verify it's a credit order with a user
        if (!"Credit Purpose".equals(order.getPaymentMethod())) {
            throw new Exception("Order ID: " + orderId + " is not a credit order");
        }
        if (order.getUser() == null) {
            throw new Exception("No user associated with Order ID: " + orderId);
        }

        // Create a new LoanNotification
        LoanNotification notification = new LoanNotification();
        notification.setOrder(order);
        notification.setUser(order.getUser());
        notification.setNotificationDate(LocalDateTime.now());
        notification.setDueAmount(order.getTotalAmount());

        // Determine notification method
        if (order.getUser().getEmail() != null && !order.getUser().getEmail().isEmpty()) {
            notification.setNotificationMethod("EMAIL");
        } else if (order.getUser().getPhoneNo() != null && !order.getUser().getPhoneNo().isEmpty()) {
            notification.setNotificationMethod("PHONE");
        } else {
            throw new Exception("No email or phone provided for user associated with Order ID: " + orderId);
        }
        notification.setStatus("PENDING");

        // Save the notification
        loanNotificationRepository.save(notification);

        // Process the notification immediately
        try {
            if ("EMAIL".equals(notification.getNotificationMethod())) {
                sendEmailNotification(notification);
            } else {
                System.out.println("Calling " + notification.getUser().getPhoneNo() +
                        " for order " + notification.getOrder().getOrderId() +
                        " with due amount " + notification.getDueAmount());
                notification.setStatus("SENT");
            }
        } catch (Exception e) {
            notification.setStatus("FAILED");
            System.err.println("Failed to send notification for order " + notification.getOrder().getOrderId() +
                    ": " + e.getMessage());
            throw e; // Re-throw to inform the caller
        } finally {
            loanNotificationRepository.save(notification);
        }
    }

    private void sendEmailNotification(LoanNotification notification) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        // Set email details
        helper.setTo(notification.getUser().getEmail());
        helper.setSubject("Payment Reminder: GroceryEase Order #" + notification.getOrder().getOrderId());
        helper.setFrom("your-email@gmail.com"); // Replace with your email

        // Construct email body
        StringBuilder emailBody = new StringBuilder();
        emailBody.append("<h2>Payment Reminder from GroceryEase</h2>")
                .append("<p>Dear ").append(notification.getUser().getFirstName() != null ? notification.getUser().getFirstName() : "Customer").append(",</p>")
                .append("<p>We hope this message finds you well. This is a reminder regarding your recent purchase on credit with GroceryEase.</p>")
                .append("<h3>Order Details</h3>")
                .append("<p><strong>Order ID:</strong> ").append(notification.getOrder().getOrderId()).append("</p>")
                .append("<p><strong>Order Date:</strong> ").append(notification.getOrder().getOrderDate()).append("</p>")
                .append("<p><strong>Due Amount:</strong> Rs.").append(String.format("%.2f", notification.getDueAmount())).append("</p>")
                .append("<h3>Items Purchased</h3>")
                .append("<table border='1' style='border-collapse: collapse; width: 100%;'>")
                .append("<tr>")
                .append("<th style='padding: 8px;'>Product</th>")
                .append("<th style='padding: 8px;'>Quantity</th>")
                .append("<th style='padding: 8px;'>Price</th>")
                .append("<th style='padding: 8px;'>Subtotal</th>")
                .append("</tr>");

        // Add items to the email table
        notification.getOrder().getItems().forEach(item -> {
            String productName = "Unknown Product";
            if (item.getBatch() != null && item.getBatch().getProduct() != null) {
                productName = item.getBatch().getProduct().getProductName();
            }
            emailBody.append("<tr>")
                    .append("<td style='padding: 8px;'>").append(productName).append("</td>")
                    .append("<td style='padding: 8px; text-align: center;'>").append(item.getQuantity()).append("</td>")
                    .append("<td style='padding: 8px; text-align: right;'>Rs.").append(String.format("%.2f", item.getSellingPrice())).append("</td>")
                    .append("<td style='padding: 8px; text-align: right;'>Rs.").append(String.format("%.2f", item.getQuantity() * item.getSellingPrice())).append("</td>")
                    .append("</tr>");
        });

        emailBody.append("</table>")
                .append("<p><strong>Total Amount Due:</strong> Rs.").append(String.format("%.2f", notification.getDueAmount())).append("</p>")
                .append("<p>Please settle the outstanding amount at your earliest convenience. If you have already made the payment, please disregard this message.</p>")
                .append("<p>For any inquiries, feel free to contact us at support@groceryease.com or call us at +1-234-567-890.</p>")
                .append("<p>Thank you for choosing GroceryEase!</p>")
                .append("<p>Best regards,<br>The GroceryEase Team</p>");

        helper.setText(emailBody.toString(), true); // true indicates HTML content

        // Send the email
        mailSender.send(message);
        System.out.println("Email sent to " + notification.getUser().getEmail() +
                " for order " + notification.getOrder().getOrderId() +
                " with due amount " + notification.getDueAmount());
        notification.setStatus("SENT");
    }

    @Transactional
    public void sendTestEmail(String toEmail, String subject, String body) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setFrom("your-email@gmail.com"); // Replace with your email
        helper.setText(body, true); // true indicates HTML content

        mailSender.send(message);
        System.out.println("Test email sent to " + toEmail + " with subject: " + subject);
    }
}