package com.uok.groceryease_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "customer")
@NoArgsConstructor
@AllArgsConstructor
@PrimaryKeyJoinColumn(name = "user_id") // Keeps 'id' from User as primary key
public class Customer extends User {

    @Column(name = "customer_id", unique = true, nullable = false, updatable = false)
    private String customerId; // Separate unique customer ID

    private String address;
    private String customerType;

    @PrePersist
    private void generateCustomerId() {
        if (this.customerId == null) {
            this.customerId = "CUST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}
