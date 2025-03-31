package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DAO.CategoryRepository;
import com.uok.groceryease_backend.DAO.ProductRepository;
import com.uok.groceryease_backend.DAO.SupplierRepository;
import com.uok.groceryease_backend.DTO.ProductDTO;
import com.uok.groceryease_backend.entity.Category;
import com.uok.groceryease_backend.entity.Product;
import com.uok.groceryease_backend.entity.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    public ProductDTO addProduct(ProductDTO productDTO) {
        Product product = new Product();
        product.setProductName(productDTO.getProductName());
        product.setQuantity(productDTO.getQuantity());
        product.setBuyingPrice(productDTO.getBuyingPrice());
        product.setSellingPrice(productDTO.getSellingPrice());

        Category category = categoryRepository.findByCategoryName(productDTO.getCategoryName())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        product.setCategory(category);

        Supplier supplier = supplierRepository.findByCompanyName(productDTO.getSupplierCompanyName())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        product.setSupplier(supplier);

        return convertToDTO(productRepository.save(product));
    }

    public List<ProductDTO> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return products.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProductDTO updateProduct(Long productId, ProductDTO productDTO) {
        Optional<Product> optionalProduct = productRepository.findById(productId);
        if (optionalProduct.isPresent()) {
            Product product = optionalProduct.get();
            product.setProductName(productDTO.getProductName());
            product.setQuantity(productDTO.getQuantity());
            product.setBuyingPrice(productDTO.getBuyingPrice());
            product.setSellingPrice(productDTO.getSellingPrice());

            Category category = categoryRepository.findByCategoryName(productDTO.getCategoryName())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);

            Supplier supplier = supplierRepository.findByCompanyName(productDTO.getSupplierCompanyName())
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            product.setSupplier(supplier);

            return convertToDTO(productRepository.save(product));
        }
        return null; // or throw an exception
    }

    @Transactional
    public void deleteProduct(Long productId) {
        productRepository.deleteById(productId);
    }

    private ProductDTO convertToDTO(Product product) {
        ProductDTO productDTO = new ProductDTO();
        productDTO.setProductId(product.getProductId());
        productDTO.setProductName(product.getProductName());
        productDTO.setQuantity(product.getQuantity());
        productDTO.setBuyingPrice(product.getBuyingPrice());
        productDTO.setSellingPrice(product.getSellingPrice());
        productDTO.setCategoryId(product.getCategory().getCategoryId());
        productDTO.setCategoryName(product.getCategory().getCategoryName());
        productDTO.setSupplierId(product.getSupplier().getUserId());
        productDTO.setSupplierCompanyName(product.getSupplier().getCompanyName());
        return productDTO;
    }
}