package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}
