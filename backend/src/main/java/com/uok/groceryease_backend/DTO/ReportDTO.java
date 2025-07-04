package com.uok.groceryease_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {
    // Inventory Stock Report
    private Long productId;
    private String productName;
    private String categoryName;
    private String supplierName;
    private double totalQuantity; // Changed from int to double
    private LocalDateTime lastRestockDate;

    // Sales Performance Report
    private String orderType;
    private String paymentMethod;
    private long totalOrders;
    private double totalSales;
    private LocalDateTime earliestOrderDate;
    private LocalDateTime latestOrderDate;

    // Product Sales Report
    private double totalUnitsSold; // Changed from int to double
    private double totalRevenue;

    // Restock History Report
    private double quantityRestocked; // Changed from int to double
    private double buyingPrice;

    // Customer Purchase Report
    private String customerUsername;
    private double totalSpent;
    private LocalDateTime lastOrderDate;
    private String orderTypes;

    // Profitability Report
    private double totalCost;
    private double profit;
}