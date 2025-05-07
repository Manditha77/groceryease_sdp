package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DAO.OrderRepository;
import com.uok.groceryease_backend.DAO.ProductRepository;
import com.uok.groceryease_backend.DAO.ProductBatchRepository;
import com.uok.groceryease_backend.DTO.OrderDTO;
import com.uok.groceryease_backend.DTO.OrderItemDTO;
import com.uok.groceryease_backend.entity.Order;
import com.uok.groceryease_backend.entity.OrderItem;
import com.uok.groceryease_backend.entity.Product;
import com.uok.groceryease_backend.entity.ProductBatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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
    private SimpMessagingTemplate messagingTemplate;

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
                    java.util.Arrays.toString(Order.Status.values()));
        }
        order.setOrderDate(LocalDateTime.now());
        order.setInventoryAdjusted(false);
        order.setOrderType(Order.OrderType.ECOMMERCE); // Set order type to ECOMMERCE

        List<OrderItem> orderItems = new ArrayList<>();
        List<String> inventoryWarnings = new ArrayList<>();

        for (OrderItemDTO itemDTO : orderDTO.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(itemDTO.getProductId());
            orderItem.setQuantity(itemDTO.getQuantity());
            orderItem.setOrder(order);

            List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(itemDTO.getProductId());
            int totalAvailableQuantity = batches.stream().mapToInt(ProductBatch::getQuantity).sum();
            if (totalAvailableQuantity < itemDTO.getQuantity()) {
                inventoryWarnings.add("Insufficient stock for product ID: " + itemDTO.getProductId() +
                        ". Required: " + itemDTO.getQuantity() + ", Available: " + totalAvailableQuantity);
                throw new RuntimeException("Insufficient stock for product ID: " + itemDTO.getProductId());
            }

            ProductBatch mostRecentBatch = batches.stream()
                    .filter(batch -> batch.getQuantity() > 0)
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
        order.setStatus(Order.Status.COMPLETED); // POS orders are completed immediately
        order.setOrderDate(LocalDateTime.now());
        order.setInventoryAdjusted(false);
        order.setOrderType(Order.OrderType.POS); // Set order type to POS

        List<OrderItem> orderItems = new ArrayList<>();
        List<String> inventoryWarnings = new ArrayList<>();

        for (OrderItemDTO itemDTO : orderDTO.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(itemDTO.getProductId());
            orderItem.setQuantity(itemDTO.getQuantity());
            orderItem.setOrder(order);

            // Validate inventory availability
            List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(itemDTO.getProductId());
            int totalAvailableQuantity = batches.stream().mapToInt(ProductBatch::getQuantity).sum();
            if (totalAvailableQuantity < itemDTO.getQuantity()) {
                inventoryWarnings.add("Insufficient stock for product ID: " + itemDTO.getProductId() +
                        ". Required: " + itemDTO.getQuantity() + ", Available: " + totalAvailableQuantity);
                throw new RuntimeException("Insufficient stock for product ID: " + itemDTO.getProductId());
            }

            // Since status is COMPLETED, deduct inventory immediately (FIFO)
            int remainingQuantity = itemDTO.getQuantity();
            ProductBatch selectedBatch = null;

            for (ProductBatch batch : batches) {
                if (remainingQuantity <= 0) break;
                if (batch.getQuantity() > 0) {
                    int quantityToTake = Math.min(remainingQuantity, batch.getQuantity());
                    batch.setQuantity(batch.getQuantity() - quantityToTake);
                    remainingQuantity -= quantityToTake;
                    selectedBatch = batch;
                    productBatchRepository.save(batch);
                }
            }

            if (remainingQuantity > 0) {
                inventoryWarnings.add("Insufficient stock for product ID: " + itemDTO.getProductId() +
                        ". Required: " + itemDTO.getQuantity() + ", Fulfilled: " + (itemDTO.getQuantity() - remainingQuantity));
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
        OrderDTO savedOrderDTO = convertToDTO(savedOrder);

        if (!inventoryWarnings.isEmpty()) {
            savedOrderDTO.setWarnings(inventoryWarnings);
        }

        messagingTemplate.convertAndSend("/topic/orders", savedOrderDTO);
        return savedOrderDTO;
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
                    java.util.Arrays.toString(Order.Status.values()));
        }

        boolean isInventoryAdjusted = order.getInventoryAdjusted() != null ? order.getInventoryAdjusted() : false;
        List<String> inventoryWarnings = new ArrayList<>();

        // Only adjust inventory for ECOMMERCE orders when status changes to COMPLETED
        if (newStatus == Order.Status.COMPLETED && !isInventoryAdjusted && order.getOrderType() == Order.OrderType.ECOMMERCE) {
            for (OrderItem item : order.getItems()) {
                List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(item.getProductId());
                int remainingQuantity = item.getQuantity();
                ProductBatch selectedBatch = null;

                for (ProductBatch batch : batches) {
                    if (remainingQuantity <= 0) break;
                    if (batch.getQuantity() > 0) {
                        int quantityToTake = Math.min(remainingQuantity, batch.getQuantity());
                        batch.setQuantity(batch.getQuantity() - quantityToTake);
                        remainingQuantity -= quantityToTake;
                        selectedBatch = batch;
                        productBatchRepository.save(batch);
                    }
                }

                if (remainingQuantity > 0) {
                    inventoryWarnings.add("Insufficient stock for product ID: " + item.getProductId() + ". Required: " +
                            item.getQuantity() + ", fulfilled: " + (item.getQuantity() - remainingQuantity));
                    continue;
                }

                if (selectedBatch != null) {
                    item.setBatch(selectedBatch);
                } else {
                    inventoryWarnings.add("No stock available for product ID: " + item.getProductId());
                }
            }

            if (inventoryWarnings.isEmpty()) {
                order.setInventoryAdjusted(true);
            }
        }

        if (newStatus == Order.Status.CANCELLED && isInventoryAdjusted) {
            for (OrderItem item : order.getItems()) {
                ProductBatch batch = item.getBatch();
                if (batch != null) {
                    batch.setQuantity(batch.getQuantity() + item.getQuantity());
                    productBatchRepository.save(batch);
                } else {
                    logger.warn("Batch not found for order item ID: " + item.getId() + " during order cancellation.");
                    inventoryWarnings.add("Batch not found for product ID: " + item.getProductId() + ". Inventory not reverted for this item.");
                }
            }
            if (inventoryWarnings.isEmpty()) {
                order.setInventoryAdjusted(false);
            }
        }

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);
        OrderDTO savedOrderDTO = convertToDTO(savedOrder);

        if (!inventoryWarnings.isEmpty()) {
            savedOrderDTO.setWarnings(inventoryWarnings);
        }
        return savedOrderDTO;
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

        List<OrderItemDTO> itemDTOs = order.getItems().stream().map(item -> {
            OrderItemDTO itemDTO = new OrderItemDTO();
            itemDTO.setId(item.getId());
            itemDTO.setProductId(item.getProductId());
            itemDTO.setQuantity(item.getQuantity());
            itemDTO.setSellingPrice(item.getSellingPrice());
            return itemDTO;
        }).collect(Collectors.toList());
        orderDTO.setItems(itemDTOs);

        return orderDTO;
    }
}