package com.uok.groceryease_backend.controller;

import com.uok.groceryease_backend.DTO.OrderDTO;
import com.uok.groceryease_backend.service.OrderService;
import com.uok.groceryease_backend.service.LoanNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private LoanNotificationService loanNotificationService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody OrderDTO orderDTO) {
        OrderDTO savedOrderDTO = orderService.createOrder(orderDTO);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("order", savedOrderDTO);
        if (savedOrderDTO.getWarnings() != null && !savedOrderDTO.getWarnings().isEmpty()) {
            response.put("warnings", savedOrderDTO.getWarnings());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/pos")
    public ResponseEntity<Map<String, Object>> createPosOrder(@RequestBody OrderDTO orderDTO) {
        OrderDTO savedOrderDTO = orderService.createPosOrder(orderDTO);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("order", savedOrderDTO);
        if (savedOrderDTO.getWarnings() != null && !savedOrderDTO.getWarnings().isEmpty()) {
            response.put("warnings", savedOrderDTO.getWarnings());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        List<OrderDTO> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long orderId) {
        OrderDTO orderDTO = orderService.getOrderById(orderId);
        return ResponseEntity.ok(orderDTO);
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(@PathVariable Long orderId, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null) {
            throw new IllegalArgumentException("Status is required");
        }
        OrderDTO updatedOrderDTO = orderService.updateOrderStatus(orderId, status);
        Map<String, Object> response = new HashMap<>();
        response.put("data", updatedOrderDTO);
        if (updatedOrderDTO.getWarnings() != null && !updatedOrderDTO.getWarnings().isEmpty()) {
            response.put("warnings", updatedOrderDTO.getWarnings());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customer/{customerName}")
    public ResponseEntity<List<OrderDTO>> getOrdersByCustomer(@PathVariable String customerName) {
        List<OrderDTO> orders = orderService.getOrdersByCustomer(customerName);
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/{orderId}/send-notification")
    public ResponseEntity<Map<String, Object>> sendLoanNotification(@PathVariable Long orderId) {
        Map<String, Object> response = new HashMap<>();
        try {
            loanNotificationService.createAndSendNotification(orderId);
            response.put("success", true);
            response.put("message", "Notification sent successfully for Order ID: " + orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to send notification: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/test-email")
    public ResponseEntity<Map<String, Object>> sendTestEmail(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String toEmail = request.get("toEmail");
            String subject = request.getOrDefault("subject", "Test Email from GroceryEase");
            String body = request.getOrDefault("body", "<h1>Test Email</h1><p>This is a test email to verify email sending.</p>");
            if (toEmail == null || toEmail.trim().isEmpty()) {
                throw new IllegalArgumentException("toEmail is required");
            }
            loanNotificationService.sendTestEmail(toEmail, subject, body);
            response.put("success", true);
            response.put("message", "Test email sent successfully to " + toEmail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to send test email: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}