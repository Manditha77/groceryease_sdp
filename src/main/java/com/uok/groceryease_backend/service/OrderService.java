package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DAO.OrderRepository;
import com.uok.groceryease_backend.DAO.ProductRepository;
import com.uok.groceryease_backend.DAO.ProductBatchRepository;
import com.uok.groceryease_backend.DAO.LoanNotificationRepository;
import com.uok.groceryease_backend.DTO.OrderDTO;
import com.uok.groceryease_backend.DTO.OrderItemDTO;
import com.uok.groceryease_backend.DTO.UserRegistrationDTO;
import com.uok.groceryease_backend.DTO.ReceiptDTO;
import com.uok.groceryease_backend.entity.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Autowired
    private LoanNotificationRepository loanNotificationRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private void validateUnitsForProduct(Long productId, double units) {
        Optional<Product> productOptional = productRepository.findById(productId);
        if (!productOptional.isPresent()) {
            throw new IllegalArgumentException("Product not found with ID: " + productId);
        }
        Product product = productOptional.get();
        if (product.getUnitType() == Product.UnitType.DISCRETE && units % 1 != 0) {
            throw new IllegalArgumentException("Units for DISCRETE product ID: " + productId + " must be an integer (e.g., 1, 2, 10).");
        }
        if (units <= 0) {
            throw new IllegalArgumentException("Units must be greater than zero for product ID: " + productId);
        }
    }

    @Transactional
    public OrderDTO createOrder(OrderDTO orderDTO) {
        Order order = new Order();
        order.setCustomerName(orderDTO.getCustomerName());
        order.setPaymentMethod(orderDTO.getPaymentMethod());
        order.setTotalAmount(orderDTO.getTotalAmount());
        try {
            order.setStatus(Order.Status.valueOf(orderDTO.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + orderDTO.getStatus() + ". Must be one of: " +
                    Arrays.toString(Order.Status.values()));
        }
        order.setOrderDate(LocalDateTime.now());
        order.setInventoryAdjusted(false);
        order.setOrderType(Order.OrderType.ECOMMERCE);

        String username = orderDTO.getUsername();
        if (username != null && !username.isEmpty()) {
            User user = userService.findUserByUsername(username);
            order.setUser(user);
            order.setUsername(username);
        } else {
            throw new IllegalArgumentException("Username must be provided for e-commerce orders.");
        }

        List<OrderItem> orderItems = new ArrayList<>();
        List<String> inventoryWarnings = new ArrayList<>();

        for (OrderItemDTO itemDTO : orderDTO.getItems()) {
            validateUnitsForProduct(itemDTO.getProductId(), itemDTO.getUnits());

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(itemDTO.getProductId());
            orderItem.setUnits(itemDTO.getUnits());
            orderItem.setOrder(order);

            List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(itemDTO.getProductId());
            double totalAvailableUnits = batches.stream().mapToDouble(ProductBatch::getUnits).sum();
            if (totalAvailableUnits < itemDTO.getUnits()) {
                inventoryWarnings.add("Insufficient stock for product ID: " + itemDTO.getProductId() +
                        ". Required: " + itemDTO.getUnits() + ", Available: " + totalAvailableUnits);
                throw new RuntimeException("Insufficient stock for product ID: " + itemDTO.getProductId());
            }

            ProductBatch mostRecentBatch = batches.stream()
                    .filter(batch -> batch.getUnits() > 0)
                    .max((b1, b2) -> b2.getCreatedDate().compareTo(b1.getCreatedDate()))
                    .orElseThrow(() -> new RuntimeException("No stock available for product ID: " + itemDTO.getProductId()));
            orderItem.setSellingPrice(mostRecentBatch.getSellingPrice());

            orderItems.add(orderItem);
        }

        order.setItems(orderItems);
        Order savedOrder = orderRepository.save(order);
        OrderDTO savedOrderDTO = convertToDTO(savedOrder);

        if (!inventoryWarnings.isEmpty()) {
            savedOrderDTO.setWarnings(inventoryWarnings);
        }

        messagingTemplate.convertAndSend("/topic/orders", savedOrderDTO);
        return savedOrderDTO;
    }

    @Transactional
    public OrderDTO createPosOrder(OrderDTO orderDTO) {
        Order order = new Order();
        order.setCustomerName(orderDTO.getCustomerName());
        order.setPaymentMethod(orderDTO.getPaymentMethod());
        order.setTotalAmount(orderDTO.getTotalAmount());
        order.setStatus(Order.Status.COMPLETED);
        order.setOrderDate(LocalDateTime.now());
        order.setInventoryAdjusted(false);
        order.setOrderType(Order.OrderType.POS);
        order.setUsername(null);

        if ("Credit Purpose".equals(orderDTO.getPaymentMethod()) && orderDTO.getCreditCustomerDetails() != null) {
            UserRegistrationDTO userDTO = new UserRegistrationDTO();
            userDTO.setFirstName(orderDTO.getCreditCustomerDetails().getFirstName());
            userDTO.setLastName(orderDTO.getCreditCustomerDetails().getLastName());
            userDTO.setPhoneNo(orderDTO.getCreditCustomerDetails().getPhone());
            userDTO.setEmail(orderDTO.getCreditCustomerDetails().getEmail());
            userDTO.setAddress(orderDTO.getCreditCustomerDetails().getAddress());
            userDTO.setUserType(UserType.CUSTOMER);
            userDTO.setCustomerType("CREDIT");

            User creditCustomer = userService.registerCreditCustomer(userDTO);
            order.setUser(creditCustomer);
        }

        List<OrderItem> orderItems = new ArrayList<>();
        List<String> inventoryWarnings = new ArrayList<>();

        for (OrderItemDTO itemDTO : orderDTO.getItems()) {
            validateUnitsForProduct(itemDTO.getProductId(), itemDTO.getUnits());

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(itemDTO.getProductId());
            orderItem.setUnits(itemDTO.getUnits());
            orderItem.setOrder(order);

            List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(itemDTO.getProductId());
            double totalAvailableUnits = batches.stream().mapToDouble(ProductBatch::getUnits).sum();
            if (totalAvailableUnits < itemDTO.getUnits()) {
                inventoryWarnings.add("Insufficient stock for product ID: " + itemDTO.getProductId() +
                        ". Required: " + itemDTO.getUnits() + ", Available: " + totalAvailableUnits);
                throw new RuntimeException("Insufficient stock for product ID: " + itemDTO.getProductId());
            }

            double remainingUnits = itemDTO.getUnits();
            ProductBatch selectedBatch = null;

            for (ProductBatch batch : batches) {
                if (remainingUnits <= 0) break;
                if (batch.getUnits() > 0) {
                    double unitsToTake = Math.min(remainingUnits, batch.getUnits());
                    batch.setUnits(batch.getUnits() - unitsToTake);
                    remainingUnits -= unitsToTake;
                    selectedBatch = batch;
                    productBatchRepository.save(batch);
                }
            }

            if (remainingUnits > 0) {
                inventoryWarnings.add("Insufficient stock for product ID: " + itemDTO.getProductId() +
                        ". Required: " + itemDTO.getUnits() + ", Fulfilled: " + (itemDTO.getUnits() - remainingUnits));
                throw new RuntimeException("Insufficient stock for product ID: " + itemDTO.getProductId());
            }

            if (selectedBatch != null) {
                orderItem.setBatch(selectedBatch);
                orderItem.setSellingPrice(selectedBatch.getSellingPrice());
            } else {
                inventoryWarnings.add("No stock available for product ID: " + itemDTO.getProductId());
                throw new RuntimeException("No stock available for product ID: " + itemDTO.getProductId());
            }

            orderItems.add(orderItem);
        }

        order.setItems(orderItems);
        if (inventoryWarnings.isEmpty()) {
            order.setInventoryAdjusted(true);
        }

        Order savedOrder = orderRepository.save(order);
        ReceiptDTO receiptDTO = generateReceipt(savedOrder);
        OrderDTO savedOrderDTO = convertToDTO(savedOrder);

        if (!inventoryWarnings.isEmpty()) {
            savedOrderDTO.setWarnings(inventoryWarnings);
        }

        savedOrderDTO.setReceipt(receiptDTO);
        messagingTemplate.convertAndSend("/topic/orders", savedOrderDTO);
        return savedOrderDTO;
    }

    private ReceiptDTO generateReceipt(Order order) {
        ReceiptDTO receiptDTO = new ReceiptDTO();
        receiptDTO.setOrderId(order.getOrderId());
        receiptDTO.setOrderDate(order.getOrderDate());
        receiptDTO.setCustomerName(order.getCustomerName());
        receiptDTO.setPaymentMethod(order.getPaymentMethod());
        receiptDTO.setTotalAmount(order.getTotalAmount());

        List<ReceiptDTO.ReceiptItemDTO> receiptItems = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            ReceiptDTO.ReceiptItemDTO receiptItem = new ReceiptDTO.ReceiptItemDTO();
            Optional<Product> productOptional = productRepository.findById(item.getProductId());
            String productName = productOptional.isPresent() ? productOptional.get().getProductName() : "Unknown Product";
            receiptItem.setProductName(productName);
            receiptItem.setUnits(item.getUnits());
            receiptItem.setSellingPrice(item.getSellingPrice());
            receiptItem.setSubtotal(item.getUnits() * item.getSellingPrice());
            receiptItems.add(receiptItem);
        }
        receiptDTO.setItems(receiptItems);

        return receiptDTO;
    }

    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAllWithItems().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO getOrderById(Long orderId) {
        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        if (!optionalOrder.isPresent()) {
            throw new RuntimeException("Order not found with ID: " + orderId);
        }
        return convertToDTO(optionalOrder.get());
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, String status) {
        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        if (!optionalOrder.isPresent()) {
            throw new RuntimeException("Order not found with ID: " + orderId);
        }

        Order order = optionalOrder.get();
        Order.Status previousStatus = order.getStatus();
        Order.Status newStatus;
        try {
            newStatus = Order.Status.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Must be one of: " +
                    Arrays.toString(Order.Status.values()));
        }

        boolean isInventoryAdjusted = order.getInventoryAdjusted() != null ? order.getInventoryAdjusted() : false;
        List<String> inventoryWarnings = new ArrayList<>();

        if (newStatus == Order.Status.PROCESSING) {
            if (previousStatus != Order.Status.PENDING) {
                throw new IllegalStateException("Order can only be set to PROCESSING from PENDING status.");
            }
            order.setStatus(newStatus);
        } else if (newStatus == Order.Status.COMPLETED && !isInventoryAdjusted && order.getOrderType() == Order.OrderType.ECOMMERCE) {
            for (OrderItem item : order.getItems()) {
                List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(item.getProductId());
                double remainingUnits = item.getUnits();
                ProductBatch selectedBatch = null;

                for (ProductBatch batch : batches) {
                    if (remainingUnits <= 0) break;
                    if (batch.getUnits() > 0) {
                        double unitsToTake = Math.min(remainingUnits, batch.getUnits());
                        batch.setUnits(batch.getUnits() - unitsToTake);
                        remainingUnits -= unitsToTake;
                        selectedBatch = batch;
                        productBatchRepository.save(batch);
                    }
                }

                if (remainingUnits > 0) {
                    inventoryWarnings.add("Insufficient stock for product ID: " + item.getProductId() + ". Required: " +
                            item.getUnits() + ", fulfilled: " + (item.getUnits() - remainingUnits));
                } else if (selectedBatch != null) {
                    item.setBatch(selectedBatch);
                } else {
                    inventoryWarnings.add("No stock available for product ID: " + item.getProductId());
                }
            }

            if (!inventoryWarnings.isEmpty()) {
                throw new IllegalStateException("Cannot complete order due to insufficient stock: " + String.join(", ", inventoryWarnings));
            }

            order.setInventoryAdjusted(true);
            order.setStatus(newStatus);
        } else if (newStatus == Order.Status.CANCELLED && isInventoryAdjusted) {
            for (OrderItem item : order.getItems()) {
                ProductBatch batch = item.getBatch();
                if (batch != null) {
                    batch.setUnits(batch.getUnits() + item.getUnits());
                    productBatchRepository.save(batch);
                } else {
                    logger.warn("Batch not found for order item ID: " + item.getId() + " during order cancellation.");
                    inventoryWarnings.add("Batch not found for product ID: " + item.getProductId() + ". Inventory not reverted for this item.");
                }
            }
            if (inventoryWarnings.isEmpty()) {
                order.setInventoryAdjusted(false);
            }
            order.setStatus(newStatus);
        } else {
            order.setStatus(newStatus);
        }

        Order savedOrder = orderRepository.save(order);
        OrderDTO savedOrderDTO = convertToDTO(savedOrder);

        if (!inventoryWarnings.isEmpty()) {
            savedOrderDTO.setWarnings(inventoryWarnings);
        }
        return savedOrderDTO;
    }

    public List<OrderDTO> getOrdersByCustomer(String username) {
        return orderRepository.findAllWithItems().stream()
                .filter(order -> order.getUsername() != null && order.getUsername().equals(username))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<OrderDTO> getCreditOrdersByPaymentStatus(boolean isPaid) {
        return orderRepository.findAllWithItems().stream()
                .filter(order -> order.getPaymentMethod().equalsIgnoreCase("Credit Purpose"))
                .filter(order -> isPaid ? order.getStatus() == Order.Status.PAID : order.getStatus() != Order.Status.PAID)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Map<String, Double> getTodaySales() {
        LocalDate today = LocalDate.now();
        List<Order> orders = orderRepository.findAllWithItems().stream()
                .filter(order -> order.getOrderDate().toLocalDate().equals(today))
                .collect(Collectors.toList());

        Map<String, Double> salesData = new HashMap<>();
        double totalSales = 0.0;
        double onlineSales = 0.0;
        double posSales = 0.0;

        for (Order order : orders) {
            double amount = order.getTotalAmount() != null ? order.getTotalAmount() : 0.0;
            totalSales += amount;
            if (order.getOrderType() == Order.OrderType.ECOMMERCE) {
                onlineSales += amount;
            } else if (order.getOrderType() == Order.OrderType.POS) {
                posSales += amount;
            }
        }

        salesData.put("totalSales", totalSales);
        salesData.put("onlineSales", onlineSales);
        salesData.put("posSales", posSales);
        return salesData;
    }

    public List<Map<String, Object>> getTodaySalesByCategory() {
        LocalDate today = LocalDate.now();
        List<Order> orders = orderRepository.findAllWithItems().stream()
                .filter(order -> order.getOrderDate().toLocalDate().equals(today))
                .collect(Collectors.toList());

        Map<String, Double> categorySales = new HashMap<>();

        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                Optional<Product> productOptional = productRepository.findById(item.getProductId());
                if (productOptional.isPresent()) {
                    Product product = productOptional.get();
                    String categoryName = product.getCategory().getCategoryName();
                    double itemTotal = item.getSellingPrice() * item.getUnits();
                    categorySales.merge(categoryName, itemTotal, Double::sum);
                }
            }
        }

        return categorySales.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("categoryName", entry.getKey());
                    map.put("sales", entry.getValue());
                    return map;
                })
                .sorted((a, b) -> Double.compare((Double) b.get("sales"), (Double) a.get("sales")))
                .collect(Collectors.toList());
    }

    public double getPendingPreOrdersUnits() {
        List<Order> pendingOrders = orderRepository.findAllWithItems().stream()
                .filter(order -> order.getOrderType() == Order.OrderType.ECOMMERCE)
                .filter(order -> order.getStatus() == Order.Status.PENDING || order.getStatus() == Order.Status.PROCESSING)
                .collect(Collectors.toList());

        return pendingOrders.stream()
                .flatMap(order -> order.getItems().stream())
                .mapToDouble(OrderItem::getUnits)
                .sum();
    }

    private OrderDTO convertToDTO(Order order) {
        OrderDTO orderDTO = new OrderDTO();
        orderDTO.setOrderId(order.getOrderId());
        orderDTO.setCustomerName(order.getCustomerName());
        orderDTO.setPaymentMethod(order.getPaymentMethod());
        orderDTO.setTotalAmount(order.getTotalAmount());
        orderDTO.setStatus(order.getStatus().name());
        orderDTO.setOrderDate(order.getOrderDate());
        orderDTO.setInventoryAdjusted(order.getInventoryAdjusted());
        orderDTO.setOrderType(order.getOrderType() != null ? order.getOrderType().name() : null);
        orderDTO.setUsername(order.getUsername());

        List<OrderItemDTO> itemDTOs = order.getItems().stream().map(item -> {
            OrderItemDTO itemDTO = new OrderItemDTO();
            itemDTO.setId(item.getId());
            itemDTO.setProductId(item.getProductId());
            itemDTO.setUnits(item.getUnits());
            itemDTO.setSellingPrice(item.getSellingPrice());
            return itemDTO;
        }).collect(Collectors.toList());
        orderDTO.setItems(itemDTOs);

        if ("Credit Purpose".equals(order.getPaymentMethod())) {
            logger.info("Order ID: {}, Payment Method: Credit Purpose, Checking for user...", order.getOrderId());
            if (order.getUser() != null) {
                User user = order.getUser();
                logger.info("User found for Order ID: {}, User ID: {}, User Type: {}",
                        order.getOrderId(), user.getUserId(), user.getUserType());
                if (user instanceof Customer) {
                    Customer customer = (Customer) user;
                    logger.info("User is a Customer for Order ID: {}. Setting creditCustomerDetails.", order.getOrderId());
                    orderDTO.setCreditCustomerDetails(new OrderDTO.CreditCustomerDetailsDTO(
                            user.getFirstName(),
                            user.getLastName(),
                            user.getPhoneNo(),
                            user.getEmail(),
                            customer.getAddress()
                    ));
                } else {
                    logger.warn("User associated with credit order (Order ID: {}) is not a Customer. Actual type: {}",
                            order.getOrderId(), user.getClass().getName());
                }
            } else {
                logger.warn("No user associated with credit order (Order ID: {})", order.getOrderId());
            }
        } else {
            logger.info("Order ID: {}, Not a credit order (Payment Method: {})",
                    order.getOrderId(), order.getPaymentMethod());
        }

        return orderDTO;
    }
}