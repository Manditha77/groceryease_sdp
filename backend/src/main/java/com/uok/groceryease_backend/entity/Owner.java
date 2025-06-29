package com.uok.groceryease_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "owner")
@NoArgsConstructor
@AllArgsConstructor
@PrimaryKeyJoinColumn(name = "user_id")
public class Owner extends User {

    @Column(name = "owner_id", unique = true, nullable = false, updatable = false)
    private String ownerId;

    @PrePersist
    private void generateOwnerId() {
        if (this.ownerId == null) {
            this.ownerId = "OWN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}
