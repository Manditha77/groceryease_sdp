package com.uok.groceryease_backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "supplier")
@NoArgsConstructor
@AllArgsConstructor
@PrimaryKeyJoinColumn(name = "user_id")
public class Supplier extends User {

    @Column(name = "supplier_id", unique = true, nullable = false, updatable = false)
    private String supplierId;

    @Column(nullable = false)
    private String companyName;

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL)
    private List<Product> products;

    @PrePersist
    private void generateSupplierId() {
        if (this.supplierId == null) {
            this.supplierId = "SUP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}
