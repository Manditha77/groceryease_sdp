package com.uok.groceryease_backend.DTO;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Long productId;

    @NotBlank(message = "Product name cannot be empty")
    private String productName;

    private double units; // Changed from int quantity to double units

    private double buyingPrice;

    private double sellingPrice;

    private Long categoryId;

    private String categoryName;

    private Long supplierId;

    private String supplierCompanyName;

    private byte[] image;

    private String base64Image;

    private String barcode;

    private String unitType; // Added to specify DISCRETE or WEIGHT

    private LocalDateTime expireDate;
}