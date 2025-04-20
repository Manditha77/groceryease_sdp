package com.uok.groceryease_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "employee")
@NoArgsConstructor
@AllArgsConstructor
@PrimaryKeyJoinColumn(name = "user_id")
public class Employee extends User {

    @Column(name = "employee_id", unique = true, nullable = false, updatable = false)
    private String employeeId;

    private String address;

    @PrePersist
    private void generateEmployeeId() {
        if (this.employeeId == null) {
            this.employeeId = "EMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }

    
}
