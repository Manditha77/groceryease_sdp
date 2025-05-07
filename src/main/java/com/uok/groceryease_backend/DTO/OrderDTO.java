package com.uok.groceryease_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private Long orderId;
    private String customerName;
    private String paymentMethod;
    private Double totalAmount;
    private String status;
    private LocalDateTime orderDate;
    private List<OrderItemDTO> items;
    private List<String> warnings; // Added for inventory adjustment warnings
    private Boolean inventoryAdjusted; // Added to expose inventoryAdjusted to the frontend
    private String orderType; // Added to expose orderType to the frontend
}