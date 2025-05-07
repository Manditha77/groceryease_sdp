package com.uok.groceryease_backend.DTO;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Long productId;

    @NotBlank(message = "Product name cannot be empty")
    private String productName;

    private int quantity;

    private double buyingPrice;

    private double sellingPrice;

    private Long categoryId;

    private String categoryName;

    private Long supplierId;

    private String supplierCompanyName;

    private byte[] image;

    private String base64Image;

    private String barcode; // New barcode field
}