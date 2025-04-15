package com.uok.groceryease_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.*;

@Getter
@Setter
@Entity
@Table(name = "product")
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false)
    @Min(value = 1, message = "Quantity must be greater than or equal to 0")
    private int quantity;

    @Column(nullable = false)
    @Positive(message = "Buying price must be a positive value")
    private double buyingPrice;

    @Column(nullable = false)
    @Positive(message = "Selling price must be a positive value")
    private double sellingPrice;

    @ManyToOne
    @JoinColumn(name = "categoryId", nullable = false)
    private Category category;

    @ManyToOne
    @JoinColumn(name = "supplierId", nullable = false)
    private Supplier supplier;
}
