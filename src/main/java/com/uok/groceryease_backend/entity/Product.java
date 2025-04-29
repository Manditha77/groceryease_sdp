package com.uok.groceryease_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.*;

import java.util.ArrayList;
import java.util.List;

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

    @ManyToOne
    @JoinColumn(name = "categoryId", nullable = false)
    private Category category;

    @ManyToOne
    @JoinColumn(name = "supplierId", nullable = false)
    private Supplier supplier;

    @Lob
    @Column(name = "image", columnDefinition = "LONGBLOB")
    private byte[] image;  // Field to store the image as a BLOB

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProductBatch> batches = new ArrayList<>();

    // Helper method to get total quantity
    public int getTotalQuantity() {
        return batches.stream().mapToInt(ProductBatch::getQuantity).sum();
    }
}