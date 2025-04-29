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

    private int quantity; // Total quantity across all batches

    private double buyingPrice; // Latest batch's buying price (for display)

    private double sellingPrice; // Latest batch's selling price (for display)

    private Long categoryId;

    private String categoryName;

    private Long supplierId;

    private String supplierCompanyName;

    private byte[] image;  // Field to store the image as a BLOB

    private String base64Image; // Field to store the Base64-encoded image
}