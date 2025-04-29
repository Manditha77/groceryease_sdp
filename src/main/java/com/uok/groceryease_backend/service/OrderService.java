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
        order.setInventoryAdjusted(false); // Explicitly set to false on creation

        List<OrderItem> orderItems = new ArrayList<>();
        List<String> inventoryWarnings = new ArrayList<>();

        // Process each order item without deducting inventory
        for (OrderItemDTO itemDTO : orderDTO.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(itemDTO.getProductId());
            orderItem.setQuantity(itemDTO.getQuantity());
            orderItem.setOrder(order);

            // Check if there's enough inventory (but don't deduct yet)
            List<ProductBatch> batches = productBatchRepository.findByProductProductIdOrderByCreatedDateAsc(itemDTO.getProductId());
            int totalAvailableQuantity = batches.stream().mapToInt(ProductBatch::getQuantity).sum();
            if (totalAvailableQuantity < itemDTO.getQuantity()) {
                inventoryWarnings.add("Insufficient stock for product ID: " + itemDTO.getProductId() +
                        ". Required: " + itemDTO.getQuantity() + ", Available: " + totalAvailableQuantity);
                throw new RuntimeException("Insufficient stock for product ID: " + itemDTO.getProductId());
            }

            // Set the selling price from the most recent batch (for reference)
            ProductBatch mostRecentBatch = batches.stream()
                    .filter(batch -> batch.getQuantity() > 0)
                    .max((b1, b2) -> b2.getCreatedDate().compareTo(b1.getCreatedDate()))
                    .orElseThrow(() -> new RuntimeException("No stock available for product ID: " + itemDTO.getProductId()));
            orderItem.setSellingPrice(mostRecentBatch.getSellingPrice());
            // Do NOT set the batch yet; we'll do this when the status changes to COMPLETED

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

        // Deduct inventory when transitioning to COMPLETED
        if (newStatus == Order.Status.COMPLETED && !isInventoryAdjusted) {
            for (OrderItem item : order.getItems()) {
                // Find batches for this product (FIFO)
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

        // Restock inventory when transitioning to CANCELLED
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
        Order updatedOrder = orderRepository.save(order);
        OrderDTO orderDTO = convertToDTO(updatedOrder);

        if (!inventoryWarnings.isEmpty()) {
            orderDTO.setWarnings(inventoryWarnings);
        }
        return orderDTO;
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