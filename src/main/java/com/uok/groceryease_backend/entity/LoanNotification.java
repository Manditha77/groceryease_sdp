package com.uok.groceryease_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_notifications")
@Getter
@Setter
public class LoanNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDateTime notificationDate;
    private Double dueAmount;
    private String notificationMethod; // "EMAIL" or "PHONE"
    private String status; // "PENDING", "SENT", "FAILED"
}