package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DAO.OrderRepository;
import com.uok.groceryease_backend.entity.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OrderNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(OrderNotificationService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private JavaMailSender mailSender;

    // In-memory cache to track sent notifications
    private final ConcurrentHashMap<String, LocalDateTime> notificationCache = new ConcurrentHashMap<>();

    @Transactional
    public void sendOrderReceivedNotification(Long orderId) throws Exception {
        logger.info("Attempting to send ORDER_RECEIVED notification for Order ID: {}", orderId);
        sendNotification(orderId, "ORDER_RECEIVED", "Order Received - GroceryEase");
    }

    @Transactional
    public void sendOrderCompletedNotification(Long orderId) throws Exception {
        logger.info("Attempting to send ORDER_COMPLETED notification for Order ID: {}", orderId);
        sendNotification(orderId, "ORDER_COMPLETED", "Order Completed - GroceryEase");
    }

    private void sendNotification(Long orderId, String notificationType, String emailSubject) throws Exception {
        // Check for recent notifications in cache (within the last hour)
        String cacheKey = orderId + "_" + notificationType;
        LocalDateTime lastSent = notificationCache.get(cacheKey);
        if (lastSent != null && lastSent.isAfter(LocalDateTime.now().minusHours(1))) {
            logger.warn("Duplicate notification attempt for Order ID: {}, Type: {}", orderId, notificationType);
            throw new Exception("A " + notificationType.replace("_", " ").toLowerCase() +
                    " notification was already sent for Order ID: " + orderId + " within the last hour");
        }

        // Fetch the order
        logger.debug("Fetching order with ID: {}", orderId);
        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        if (!optionalOrder.isPresent()) {
            logger.error("Order not found with ID: {}", orderId);
            throw new Exception("Order not found with ID: " + orderId);
        }
        Order order = optionalOrder.get();
        logger.debug("Order found: ID={}, Type={}, Status={}",
                order.getOrderId(), order.getOrderType(), order.getStatus());

        // Verify it's an online order
        if (order.getOrderType() == null || !Order.OrderType.ECOMMERCE.equals(order.getOrderType())) {
            logger.error("Order ID: {} is not an online order. OrderType: {}", orderId, order.getOrderType());
            throw new Exception("Order ID: " + orderId + " is not an online order");
        }

        // Verify user association
        if (order.getUser() == null) {
            logger.error("No user associated with Order ID: {}", orderId);
            throw new Exception("No user associated with Order ID: " + orderId);
        }

        // Retrieve username from UserAuth
        String username = order.getUser().getUserAuth() != null ? order.getUser().getUserAuth().getUsername() : null;
        if (username == null) {
            logger.error("No username found for user associated with Order ID: {}", orderId);
            throw new Exception("No username found for user associated with Order ID: " + orderId);
        }

        logger.debug("User found for Order ID: {}, Username: {}, Email: {}",
                orderId, username, order.getUser().getEmail());

        // Verify email
        if (order.getUser().getEmail() == null || order.getUser().getEmail().isEmpty()) {
            logger.error("No email provided for user associated with Order ID: {}", orderId);
            throw new Exception("No email provided for user associated with Order ID: " + orderId);
        }

        // Send the email
        try {
            logger.info("Sending email for Order ID: {}, Type: {}, To: {}",
                    orderId, notificationType, order.getUser().getEmail());
            sendEmailNotification(order, notificationType, emailSubject);
            // Update cache with current timestamp
            notificationCache.put(cacheKey, LocalDateTime.now());
            logger.info("Email sent successfully for Order ID: {}, Type: {}", orderId, notificationType);
        } catch (Exception e) {
            logger.error("Failed to send {} notification for Order ID: {}: {}",
                    notificationType, orderId, e.getMessage());
            throw new Exception("Failed to send " + notificationType.replace("_", " ").toLowerCase() +
                    " notification: " + e.getMessage());
        }
    }

    private void sendEmailNotification(Order order, String notificationType, String subject) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        // Set email details
        helper.setTo(order.getUser().getEmail());
        helper.setSubject(subject);
        helper.setFrom("majectri@gmail.com"); // Replace with your email

        // Construct email body
        StringBuilder emailBody = new StringBuilder();
        emailBody.append("<h2>").append(subject).append("</h2>")
                .append("<p>Dear ").append(order.getUser().getFirstName() != null ? order.getUser().getFirstName() : "Customer").append(",</p>");

        if ("ORDER_RECEIVED".equals(notificationType)) {
            emailBody.append("<p>Thank you for your order with GroceryEase! We have successfully received your order and are processing it.</p>");
        } else if ("ORDER_COMPLETED".equals(notificationType)) {
            emailBody.append("<p>Great news! Your order with GroceryEase has been completed and is ready for pickup.</p>")
                    .append("<p>Please visit our store at your earliest convenience to collect your order.</p>");
        }

        emailBody.append("<h3>Order Details</h3>")
                .append("<p><strong>Order ID:</strong> ").append(order.getOrderId()).append("</p>")
                .append("<p><strong>Order Date:</strong> ").append(order.getOrderDate()).append("</p>")
                .append("<p><strong>Total Amount:</strong> Rs.").append(String.format("%.2f", order.getTotalAmount())).append("</p>")
                .append("<h3>Items Purchased</h3>")
                .append("<table border='1' style='border-collapse: collapse; width: 100%;'>")
                .append("<tr>")
                .append("<th style='padding: 8px;'>Product</th>")
                .append("<th style='padding: 8px;'>Quantity</th>")
                .append("<th style='padding: 8px;'>Price</th>")
                .append("<th style='padding: 8px;'>Subtotal</th>")
                .append("</tr>");

        // Add items to the email table
        order.getItems().forEach(item -> {
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
                .append("<p><strong>Total Amount:</strong> Rs.").append(String.format("%.2f", order.getTotalAmount())).append("</p>")
                .append("<p>For any inquiries, feel free to contact us at majectri@gmail.com or call us at 077223273.</p>")
                .append("<p>Thank you for choosing GroceryEase!</p>")
                .append("<p>Best regards,<br>The GroceryEase Team</p>");

        helper.setText(emailBody.toString(), true); // true indicates HTML content

        // Send the email
        mailSender.send(message);
    }
}