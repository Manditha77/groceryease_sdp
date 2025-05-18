package com.uok.groceryease_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderId;

    private String customerName;
    private String paymentMethod;
    private Double totalAmount;
    @Enumerated(EnumType.STRING)
    private Status status;
    private LocalDateTime orderDate;
    private Boolean inventoryAdjusted;
    @Enumerated(EnumType.STRING)
    private OrderType orderType;
    private String username;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Link to User (Customer) for credit customers

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_id")
    private List<OrderItem> items;

    public enum Status {
        PENDING, PROCESSING, COMPLETED, CANCELLED
    }

    public enum OrderType {
        ECOMMERCE, POS
    }
}