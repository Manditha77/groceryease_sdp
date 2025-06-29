package com.uok.groceryease_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "product_batches")
@NoArgsConstructor
@AllArgsConstructor
public class ProductBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "batch_id")
    private Long batchId;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "units", nullable = false)
    private double units; // Changed from int quantity to double units

    @Column(name = "buying_price", nullable = false)
    private double buyingPrice;

    @Column(name = "selling_price", nullable = false)
    private double sellingPrice;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate = LocalDateTime.now();

    @Column(name = "expire_date", nullable = false)
    private LocalDateTime expireDate; // New field for expiration date
}