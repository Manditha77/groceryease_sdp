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

    @Min(value = 1, message = "Quantity must be greater than zero")
    private int quantity;

    @Positive(message = "Buying price must be a positive value")
    private double buyingPrice;

    @Positive(message = "Selling price must be a positive value")
    private double sellingPrice;

    private Long categoryId;

    private String categoryName;

    private Long supplierId;

    private String supplierCompanyName;
}
