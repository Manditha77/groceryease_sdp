package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.Owner;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OwnerRepository extends JpaRepository<Owner, Long> {
}
