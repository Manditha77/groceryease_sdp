package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DAO.CategoryRepository;
import com.uok.groceryease_backend.DAO.ProductRepository;
import com.uok.groceryease_backend.DAO.SupplierRepository;
import com.uok.groceryease_backend.DAO.ProductBatchRepository;
import com.uok.groceryease_backend.DTO.ProductDTO;
import com.uok.groceryease_backend.DTO.ProductBatchDTO;
import com.uok.groceryease_backend.entity.Category;
import com.uok.groceryease_backend.entity.Product;
import com.uok.groceryease_backend.entity.ProductBatch;
import com.uok.groceryease_backend.entity.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    private void validateUnits(Product.UnitType unitType, double units) {
        if (unitType == Product.UnitType.DISCRETE && units % 1 != 0) {
            throw new IllegalArgumentException("Units for DISCRETE products must be an integer (e.g., 1, 2, 10).");
        }
        if (units < 0) {
            throw new IllegalArgumentException("Units cannot be negative.");
        }
    }

    @Transactional
    public ProductDTO addProduct(ProductDTO productDTO) {
        Product product = new Product();
        String originalProductName = productDTO.getProductName();
        String modifiedProductName = originalProductName;
        product.setImage(productDTO.getImage());

        String barcode = productDTO.getBarcode();
        if (barcode != null && barcode.trim().isEmpty()) {
            barcode = null;
        }
        product.setBarcode(barcode);

        Category category = categoryRepository.findByCategoryName(productDTO.getCategoryName())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        product.setCategory(category);

        Supplier supplier = supplierRepository.findByCompanyName(productDTO.getSupplierCompanyName())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        product.setSupplier(supplier);

        // Set unitType (default to DISCRETE if not provided)
        Product.UnitType unitType = productDTO.getUnitType() != null && productDTO.getUnitType().equalsIgnoreCase("WEIGHT")
                ? Product.UnitType.WEIGHT : Product.UnitType.DISCRETE;
        product.setUnitType(unitType);

        // Validate units based on unitType
        validateUnits(unitType, productDTO.getUnits());

        List<Product> conflictingProducts = productRepository.findByProductNameAndCategoryCategoryName(
                originalProductName, productDTO.getCategoryName());

        boolean hasConflict = false;
        for (Product existingProduct : conflictingProducts) {
            if (!existingProduct.getSupplier().getCompanyName().equals(productDTO.getSupplierCompanyName())) {
                hasConflict = true;
                break;
            }
        }

        if (hasConflict) {
            modifiedProductName = originalProductName + " (" + productDTO.getSupplierCompanyName() + ")";
            product.setProductName(modifiedProductName);

            for (Product existingProduct : conflictingProducts) {
                String existingProductName = existingProduct.getProductName();
                String supplierCompanyName = existingProduct.getSupplier().getCompanyName();
                if (!existingProductName.endsWith(" (" + supplierCompanyName + ")")) {
                    String newProductName = originalProductName + " (" + supplierCompanyName + ")";
                    existingProduct.setProductName(newProductName);
                    productRepository.save(existingProduct);
                }
            }
        } else {
            product.setProductName(originalProductName);
        }

        if (barcode == null) {
            boolean nameSupplierExists = productRepository.existsByProductNameAndSupplierCompanyName(
                    originalProductName, productDTO.getSupplierCompanyName());
            if (nameSupplierExists) {
                throw new IllegalArgumentException("Product with name '" + originalProductName +
                        "' from supplier '" + productDTO.getSupplierCompanyName() + "' already exists");
            }
        } else {
            if (productRepository.findByBarcode(barcode).isPresent()) {
                throw new IllegalArgumentException("Barcode already exists: " + barcode);
            }
        }

        if (productDTO.getBuyingPrice() > productDTO.getSellingPrice()) {
            throw new IllegalArgumentException("Buying price must be less than or equal to selling price");
        }

        Product savedProduct = productRepository.save(product);

        ProductBatch batch = new ProductBatch();
        batch.setProduct(savedProduct);
        batch.setUnits(productDTO.getUnits());
        batch.setBuyingPrice(productDTO.getBuyingPrice());
        batch.setSellingPrice(productDTO.getSellingPrice());
        batch.setExpireDate(productDTO.getExpireDate() != null ? productDTO.getExpireDate() : LocalDateTime.now().plusYears(1)); // Default to 1 year if not provided
        productBatchRepository.save(batch);

        return convertToDTO(savedProduct);
    }

    @Transactional
    public ProductDTO updateProduct(Long productId, ProductDTO productDTO) {
        Optional<Product> optionalProduct = productRepository.findById(productId);
        if (optionalProduct.isPresent()) {
            Product product = optionalProduct.get();
            String originalProductName = productDTO.getProductName();
            String modifiedProductName = originalProductName;
            product.setImage(productDTO.getImage());

            String barcode = productDTO.getBarcode();
            if (barcode != null && barcode.trim().isEmpty()) {
                barcode = null;
            }
            product.setBarcode(barcode);

            Category category = categoryRepository.findByCategoryName(productDTO.getCategoryName())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);

            Supplier supplier = supplierRepository.findByCompanyName(productDTO.getSupplierCompanyName())
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            product.setSupplier(supplier);

            // Update unitType
            Product.UnitType unitType = productDTO.getUnitType() != null && productDTO.getUnitType().equalsIgnoreCase("WEIGHT")
                    ? Product.UnitType.WEIGHT : Product.UnitType.DISCRETE;
            product.setUnitType(unitType);

            // Validate units
            validateUnits(unitType, productDTO.getUnits());

            List<Product> conflictingProducts = productRepository.findByProductNameAndCategoryCategoryName(
                    originalProductName, productDTO.getCategoryName());

            boolean hasConflict = false;
            for (Product existingProduct : conflictingProducts) {
                if (!existingProduct.getProductId().equals(productId) &&
                        !existingProduct.getSupplier().getCompanyName().equals(productDTO.getSupplierCompanyName())) {
                    hasConflict = true;
                    break;
                }
            }

            if (hasConflict) {
                modifiedProductName = originalProductName + " (" + productDTO.getSupplierCompanyName() + ")";
                product.setProductName(modifiedProductName);

                for (Product existingProduct : conflictingProducts) {
                    if (!existingProduct.getProductId().equals(productId)) {
                        String existingProductName = existingProduct.getProductName();
                        String supplierCompanyName = existingProduct.getSupplier().getCompanyName();
                        if (!existingProductName.endsWith(" (" + supplierCompanyName + ")")) {
                            String newProductName = originalProductName + " (" + supplierCompanyName + ")";
                            existingProduct.setProductName(newProductName);
                            productRepository.save(existingProduct);
                        }
                    }
                }
            } else {
                product.setProductName(originalProductName);
            }

            if (barcode == null) {
                Optional<Product> existingProduct = productRepository.findByProductNameAndSupplierCompanyName(
                        originalProductName, productDTO.getSupplierCompanyName());
                if (existingProduct.isPresent() && !existingProduct.get().getProductId().equals(productId)) {
                    throw new IllegalArgumentException("Product with name '" + originalProductName +
                            "' from supplier '" + productDTO.getSupplierCompanyName() + "' already exists");
                }
            } else {
                if (!barcode.equals(product.getBarcode()) &&
                        productRepository.findByBarcode(barcode).isPresent()) {
                    throw new IllegalArgumentException("Barcode already exists: " + barcode);
                }
            }

            Product updatedProduct = productRepository.save(product);

            if (productDTO.getUnits() > 0) {
                List<ProductBatch> existingBatches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(productId);
                boolean batchUpdated = false;

                for (ProductBatch batch : existingBatches) {
                    if (batch.getBuyingPrice() == productDTO.getBuyingPrice() &&
                            batch.getSellingPrice() == productDTO.getSellingPrice() &&
                            batch.getExpireDate().equals(productDTO.getExpireDate())) {
                        batch.setUnits(batch.getUnits() + productDTO.getUnits());
                        productBatchRepository.save(batch);
                        batchUpdated = true;
                        break;
                    }
                }

                if (!batchUpdated) {
                    ProductBatch newBatch = new ProductBatch();
                    newBatch.setProduct(updatedProduct);
                    newBatch.setUnits(productDTO.getUnits());
                    newBatch.setBuyingPrice(productDTO.getBuyingPrice());
                    newBatch.setSellingPrice(productDTO.getSellingPrice());
                    newBatch.setExpireDate(productDTO.getExpireDate() != null ? productDTO.getExpireDate() : LocalDateTime.now().plusYears(1)); // Default to 1 year if not provided
                    productBatchRepository.save(newBatch);
                }
            }

            return convertToDTO(updatedProduct);
        }
        throw new RuntimeException("Product not found with ID: " + productId);
    }

    @Transactional
    public ProductDTO restockProduct(Long productId, double units, double buyingPrice, double sellingPrice, Long batchId) {
        Optional<Product> optionalProduct = productRepository.findById(productId);
        if (!optionalProduct.isPresent()) {
            throw new RuntimeException("Product not found with ID: " + productId);
        }

        Product product = optionalProduct.get();
        validateUnits(product.getUnitType(), units);

        if (batchId != null) {
            Optional<ProductBatch> optionalBatch = productBatchRepository.findById(batchId);
            if (!optionalBatch.isPresent()) {
                throw new RuntimeException("Batch not found with ID: " + batchId);
            }
            ProductBatch batch = optionalBatch.get();
            if (batch.getBuyingPrice() != buyingPrice || batch.getSellingPrice() != sellingPrice) {
                throw new IllegalArgumentException("Prices do not match the selected batch");
            }
            batch.setUnits(batch.getUnits() + units);
            productBatchRepository.save(batch);
        } else {
            ProductBatch newBatch = new ProductBatch();
            newBatch.setProduct(product);
            newBatch.setUnits(units);
            newBatch.setBuyingPrice(buyingPrice);
            newBatch.setSellingPrice(sellingPrice);
            newBatch.setExpireDate(LocalDateTime.now().plusYears(1)); // Default to 1 year if not provided
            productBatchRepository.save(newBatch);
        }

        return convertToDTO(product);
    }

    @Transactional
    public ProductBatchDTO updateBatch(Long batchId, double units, double buyingPrice, double sellingPrice, LocalDateTime expireDate) {
        Optional<ProductBatch> optionalBatch = productBatchRepository.findById(batchId);
        if (!optionalBatch.isPresent()) {
            throw new RuntimeException("Batch not found with ID: " + batchId);
        }

        ProductBatch batch = optionalBatch.get();
        validateUnits(batch.getProduct().getUnitType(), units);

        if (buyingPrice <= 0 || sellingPrice <= 0) {
            throw new IllegalArgumentException("Buying and selling prices must be greater than zero");
        }
        if (buyingPrice > sellingPrice) {
            throw new IllegalArgumentException("Buying price must be less than or equal to selling price");
        }
        if (expireDate == null || expireDate.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Expire date must be in the future");
        }

        batch.setUnits(units);
        batch.setBuyingPrice(buyingPrice);
        batch.setSellingPrice(sellingPrice);
        batch.setExpireDate(expireDate);
        productBatchRepository.save(batch);

        return convertToBatchDTO(batch);
    }

    @Transactional
    public void deleteBatch(Long batchId) {
        Optional<ProductBatch> optionalBatch = productBatchRepository.findById(batchId);
        if (!optionalBatch.isPresent()) {
            throw new RuntimeException("Batch not found with ID: " + batchId);
        }
        productBatchRepository.deleteById(batchId);
    }

    @Transactional
    public List<ProductBatchDTO> getExpiringBatches() {
        LocalDateTime tenDaysFromNow = LocalDateTime.now().plusDays(10);
        List<ProductBatch> batches = productBatchRepository.findAll();
        return batches.stream()
                .filter(batch -> batch.getExpireDate().isBefore(tenDaysFromNow) && batch.getExpireDate().isAfter(LocalDateTime.now()) && batch.getUnits() > 0)
                .map(this::convertToBatchDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateBatchPrices(Long productId, double newBuyingPrice, double newSellingPrice) {
        List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(productId);
        for (ProductBatch batch : batches) {
            if (batch.getUnits() > 0) {
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
        return null;
    }

    public ProductDTO getProductByNameAndSupplier(String productName, String supplierCompanyName) {
        Optional<Product> optionalProduct = productRepository.findByProductNameAndSupplierCompanyName(productName, supplierCompanyName);
        if (optionalProduct.isPresent()) {
            return convertToDTO(optionalProduct.get());
        }
        return null;
    }

    public List<ProductDTO> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return products.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private ProductDTO convertToDTO(Product product) {
        ProductDTO productDTO = new ProductDTO();
        productDTO.setProductId(product.getProductId());
        productDTO.setProductName(product.getProductName());
        productDTO.setBarcode(product.getBarcode());
        // Calculate total units using the correct repository method
        double totalUnits = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(product.getProductId())
                .stream()
                .mapToDouble(ProductBatch::getUnits)
                .sum();
        productDTO.setUnits(totalUnits); // Set the correct total units
        productDTO.setCategoryId(product.getCategory().getCategoryId());
        productDTO.setCategoryName(product.getCategory().getCategoryName());
        productDTO.setSupplierId(product.getSupplier().getUserId());
        productDTO.setSupplierCompanyName(product.getSupplier().getCompanyName());
        productDTO.setImage(product.getImage());
        productDTO.setUnitType(product.getUnitType().name());

        List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(product.getProductId());
        boolean batchFound = false;
        for (ProductBatch batch : batches) {
            if (batch.getUnits() > 0) {
                productDTO.setBuyingPrice(batch.getBuyingPrice());
                productDTO.setSellingPrice(batch.getSellingPrice());
                productDTO.setExpireDate(batch.getExpireDate()); // Set the earliest expire date
                batchFound = true;
                break;
            }
        }

        if (!batchFound) {
            if (!batches.isEmpty()) {
                ProductBatch latestBatch = batches.get(batches.size() - 1);
                productDTO.setBuyingPrice(latestBatch.getBuyingPrice());
                productDTO.setSellingPrice(latestBatch.getSellingPrice());
                productDTO.setExpireDate(latestBatch.getExpireDate());
            } else {
                productDTO.setBuyingPrice(0.0);
                productDTO.setSellingPrice(0.0);
                productDTO.setExpireDate(null);
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
        batchDTO.setUnits(batch.getUnits());
        batchDTO.setBuyingPrice(batch.getBuyingPrice());
        batchDTO.setSellingPrice(batch.getSellingPrice());
        batchDTO.setCreatedDate(batch.getCreatedDate());
        batchDTO.setExpireDate(batch.getExpireDate());
        return batchDTO;
    }
}