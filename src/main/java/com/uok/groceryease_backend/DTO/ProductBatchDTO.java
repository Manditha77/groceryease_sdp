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
public class ProductBatchDTO {
    private Long batchId;
    private Long productId;
    private String productName;
    private double units; // Changed from int quantity to double units
    private double buyingPrice;
    private double sellingPrice;
    private LocalDateTime createdDate;
    private LocalDateTime expireDate; // New field for expiration date
}