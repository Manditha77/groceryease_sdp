package com.uok.groceryease_backend.DTO;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
public class ReceiptDTO {

    // Getters and Setters
    private Long orderId;
    private LocalDateTime orderDate;
    private String customerName;
    private String paymentMethod;
    private List<ReceiptItemDTO> items;
    private Double totalAmount;
    private String receiptHeader;
    private String receiptFooter;

    // Constructor
    public ReceiptDTO() {
        this.receiptHeader = "===== GroceryEase POS Receipt =====";
        this.receiptFooter = "Thank you for shopping with us!\nVisit us again at www.groceryease.com";
    }

    @Setter
    @Getter
    public static class ReceiptItemDTO {
        // Getters and Setters
        private String productName;
        private Double units; // Added to specify DISCRETE or WEIGHT
        private Double sellingPrice;
        private Double subtotal;

    }
}