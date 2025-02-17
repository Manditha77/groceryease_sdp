package com.uok.groceryease_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Entity
@Table(name = "owner")
@AllArgsConstructor
public class Owner extends User {
}
