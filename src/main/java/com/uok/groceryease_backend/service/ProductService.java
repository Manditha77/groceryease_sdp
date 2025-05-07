package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DAO.CategoryRepository;
import com.uok.groceryease_backend.DAO.ProductRepository;
import com.uok.groceryease_backend.DAO.SupplierRepository;
import com.uok.groceryease_backend.DAO.ProductBatchRepository;
import com.uok.groceryease_backend.DTO.ProductDTO;
import com.uok.groceryease_backend.DTO.ProductBatchDTO;
import com.uok.groceryease_backend.entity.Category;
import com.uok.groceryease_backend.entity.Product;
import com.uok.groceryease_backend.entity.Supplier;
import com.uok.groceryease_backend.entity.ProductBatch;
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

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Transactional
    public ProductDTO addProduct(ProductDTO productDTO) {
        Product product = new Product();
        product.setProductName(productDTO.getProductName());
        product.setBarcode(productDTO.getBarcode());
        product.setImage(productDTO.getImage());

        Category category = categoryRepository.findByCategoryName(productDTO.getCategoryName())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        product.setCategory(category);

        Supplier supplier = supplierRepository.findByCompanyName(productDTO.getSupplierCompanyName())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        product.setSupplier(supplier);

        if (productRepository.existsByProductName(productDTO.getProductName())) {
            throw new IllegalArgumentException("Product already exists");
        }
        if (productDTO.getBarcode() != null && productRepository.findByBarcode(productDTO.getBarcode()).isPresent()) {
            throw new IllegalArgumentException("Barcode already exists: " + productDTO.getBarcode());
        }
        if (productDTO.getBuyingPrice() > productDTO.getSellingPrice()) {
            throw new IllegalArgumentException("Buying price must be less than or equal to selling price");
        }

        Product savedProduct = productRepository.save(product);

        ProductBatch batch = new ProductBatch();
        batch.setProduct(savedProduct);
        batch.setQuantity(productDTO.getQuantity());
        batch.setBuyingPrice(productDTO.getBuyingPrice());
        batch.setSellingPrice(productDTO.getSellingPrice());
        productBatchRepository.save(batch);

        return convertToDTO(savedProduct);
    }

    public List<ProductDTO> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return products.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductDTO updateProduct(Long productId, ProductDTO productDTO) {
        Optional<Product> optionalProduct = productRepository.findById(productId);
        if (optionalProduct.isPresent()) {
            Product product = optionalProduct.get();
            product.setProductName(productDTO.getProductName());
            product.setBarcode(productDTO.getBarcode());
            product.setImage(productDTO.getImage());

            Category category = categoryRepository.findByCategoryName(productDTO.getCategoryName())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);

            Supplier supplier = supplierRepository.findByCompanyName(productDTO.getSupplierCompanyName())
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            product.setSupplier(supplier);

            if (productDTO.getBarcode() != null && !productDTO.getBarcode().equals(product.getBarcode()) &&
                    productRepository.findByBarcode(productDTO.getBarcode()).isPresent()) {
                throw new IllegalArgumentException("Barcode already exists: " + productDTO.getBarcode());
            }

            Product updatedProduct = productRepository.save(product);

            if (productDTO.getQuantity() > 0) {
                List<ProductBatch> existingBatches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(productId);
                boolean batchUpdated = false;

                for (ProductBatch batch : existingBatches) {
                    if (batch.getBuyingPrice() == productDTO.getBuyingPrice() &&
                            batch.getSellingPrice() == productDTO.getSellingPrice()) {
                        batch.setQuantity(batch.getQuantity() + productDTO.getQuantity());
                        productBatchRepository.save(batch);
                        batchUpdated = true;
                        break;
                    }
                }

                if (!batchUpdated) {
                    ProductBatch newBatch = new ProductBatch();
                    newBatch.setProduct(updatedProduct);
                    newBatch.setQuantity(productDTO.getQuantity());
                    newBatch.setBuyingPrice(productDTO.getBuyingPrice());
                    newBatch.setSellingPrice(productDTO.getSellingPrice());
                    productBatchRepository.save(newBatch);
                }
            }

            return convertToDTO(updatedProduct);
        }
        throw new RuntimeException("Product not found with ID: " + productId);
    }

    @Transactional
    public ProductDTO restockProduct(Long productId, int quantity, double buyingPrice, double sellingPrice, Long batchId) {
        Optional<Product> optionalProduct = productRepository.findById(productId);
        if (!optionalProduct.isPresent()) {
            throw new RuntimeException("Product not found with ID: " + productId);
        }

        Product product = optionalProduct.get();

        if (batchId != null) {
            Optional<ProductBatch> optionalBatch = productBatchRepository.findById(batchId);
            if (!optionalBatch.isPresent()) {
                throw new RuntimeException("Batch not found with ID: " + batchId);
            }
            ProductBatch batch = optionalBatch.get();
            if (batch.getBuyingPrice() != buyingPrice || batch.getSellingPrice() != sellingPrice) {
                throw new IllegalArgumentException("Prices do not match the selected batch");
            }
            batch.setQuantity(batch.getQuantity() + quantity);
            productBatchRepository.save(batch);
        } else {
            ProductBatch newBatch = new ProductBatch();
            newBatch.setProduct(product);
            newBatch.setQuantity(quantity);
            newBatch.setBuyingPrice(buyingPrice);
            newBatch.setSellingPrice(sellingPrice);
            productBatchRepository.save(newBatch);
        }

        return convertToDTO(product);
    }

    @Transactional
    public void updateBatchPrices(Long productId, double newBuyingPrice, double newSellingPrice) {
        List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(productId);
        for (ProductBatch batch : batches) {
            if (batch.getQuantity() > 0) {
                batch.setBuyingPrice(newBuyingPrice);
                batch.setSellingPrice(newSellingPrice);
                productBatchRepository.save(batch);
            }
        }
    }

    public List<ProductBatchDTO> getProductBatches(Long productId) {
        List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(productId);
        return batches.stream()
                .map(this::convertToBatchDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteProduct(Long productId) {
        productRepository.deleteById(productId);
    }

    public ProductDTO getProductByBarcode(String barcode) {
        Optional<Product> optionalProduct = productRepository.findByBarcode(barcode);
        if (optionalProduct.isPresent()) {
            return convertToDTO(optionalProduct.get());
        }
        return null; // Return null if no product is found
    }

    private ProductDTO convertToDTO(Product product) {
        ProductDTO productDTO = new ProductDTO();
        productDTO.setProductId(product.getProductId());
        productDTO.setProductName(product.getProductName());
        productDTO.setBarcode(product.getBarcode());
        productDTO.setQuantity(product.getTotalQuantity());
        productDTO.setCategoryId(product.getCategory().getCategoryId());
        productDTO.setCategoryName(product.getCategory().getCategoryName());
        productDTO.setSupplierId(product.getSupplier().getUserId());
        productDTO.setSupplierCompanyName(product.getSupplier().getCompanyName());
        productDTO.setImage(product.getImage());

        List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(product.getProductId());
        boolean batchFound = false;
        for (ProductBatch batch : batches) {
            if (batch.getQuantity() > 0) {
                productDTO.setBuyingPrice(batch.getBuyingPrice());
                productDTO.setSellingPrice(batch.getSellingPrice());
                batchFound = true;
                break;
            }
        }

        if (!batchFound) {
            if (!batches.isEmpty()) {
                ProductBatch latestBatch = batches.get(batches.size() - 1);
                productDTO.setBuyingPrice(latestBatch.getBuyingPrice());
                productDTO.setSellingPrice(latestBatch.getSellingPrice());
            } else {
                productDTO.setBuyingPrice(0.0);
                productDTO.setSellingPrice(0.0);
            }
        }

        if (product.getImage() != null) {
            productDTO.setBase64Image(java.util.Base64.getEncoder().encodeToString(product.getImage()));
        }
        return productDTO;
    }

    private ProductBatchDTO convertToBatchDTO(ProductBatch batch) {
        ProductBatchDTO batchDTO = new ProductBatchDTO();
        batchDTO.setBatchId(batch.getBatchId());
        batchDTO.setProductId(batch.getProduct().getProductId());
        batchDTO.setProductName(batch.getProduct().getProductName());
        batchDTO.setQuantity(batch.getQuantity());
        batchDTO.setBuyingPrice(batch.getBuyingPrice());
        batchDTO.setSellingPrice(batch.getSellingPrice());
        batchDTO.setCreatedDate(batch.getCreatedDate());
        return batchDTO;
    }
}