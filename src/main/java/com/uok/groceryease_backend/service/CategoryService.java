package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DAO.CategoryRepository;
import com.uok.groceryease_backend.DTO.CategoryDTO;
import com.uok.groceryease_backend.entity.Category;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public CategoryDTO addCategory(CategoryDTO categoryDTO) {
        Category category = new Category();
        category.setCategoryName(categoryDTO.getCategoryName());
        return convertToDTO(categoryRepository.save(category));
    }

    public List<CategoryDTO> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CategoryDTO updateCategory(Long categoryId, CategoryDTO categoryDTO) {
        Optional<Category> optionalCategory = categoryRepository.findById(categoryId);
        if (optionalCategory.isPresent()) {
            Category category = optionalCategory.get();
            category.setCategoryName(categoryDTO.getCategoryName());
            return convertToDTO(categoryRepository.save(category));
        }
        return null; // or throw an exception
    }

    public void deleteCategory(Long categoryId) {
        categoryRepository.deleteById(categoryId);
    }

    private CategoryDTO convertToDTO(Category category) {
        CategoryDTO categoryDTO = new CategoryDTO();
        categoryDTO.setCategoryId(category.getCategoryId());
        categoryDTO.setCategoryName(category.getCategoryName());
        return categoryDTO;
    }
}