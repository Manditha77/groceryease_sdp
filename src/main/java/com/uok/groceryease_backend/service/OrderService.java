package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DAO.OrderRepository;
import com.uok.groceryease_backend.DAO.ProductRepository;
import com.uok.groceryease_backend.DTO.OrderDTO;
import com.uok.groceryease_backend.DTO.OrderItemDTO;
import com.uok.groceryease_backend.entity.Order;
import com.uok.groceryease_backend.entity.OrderItem;
import com.uok.groceryease_backend.entity.Product;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
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
    private SimpMessagingTemplate messagingTemplate; // For WebSocket messaging

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

        List<OrderItem> orderItems = orderDTO.getItems().stream().map(itemDTO -> {
            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(itemDTO.getProductId());
            orderItem.setQuantity(itemDTO.getQuantity());
            orderItem.setOrder(order);
            return orderItem;
        }).collect(Collectors.toList());

        order.setItems(orderItems);
        Order savedOrder = orderRepository.save(order);
        OrderDTO savedOrderDTO = convertToDTO(savedOrder);

        // Broadcast the new order to all connected clients
        messagingTemplate.convertAndSend("/topic/orders", savedOrderDTO);

        return savedOrderDTO;
    }

    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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

        // Handle inventory adjustments
        boolean isInventoryAdjusted = order.getInventoryAdjusted() != null ? order.getInventoryAdjusted() : false;
        List<String> inventoryWarnings = new ArrayList<>();

        if (newStatus == Order.Status.COMPLETED && !isInventoryAdjusted) {
            for (OrderItem item : order.getItems()) {
                Optional<Product> optionalProduct = productRepository.findById(item.getProductId());
                if (optionalProduct.isPresent()) {
                    Product product = optionalProduct.get();
                    int newQuantity = product.getQuantity() - item.getQuantity();
                    if (newQuantity < 0) {
                        logger.warn("Insufficient stock for product ID: " + item.getProductId() + " during order completion.");
                        inventoryWarnings.add("Insufficient stock for product ID: " + item.getProductId() + ". Inventory not adjusted for this item.");
                        continue;
                    }
                    product.setQuantity(newQuantity);
                    productRepository.save(product);
                } else {
                    logger.warn("Product not found with ID: " + item.getProductId() + " during order completion.");
                    inventoryWarnings.add("Product not found with ID: " + item.getProductId() + ". Inventory not adjusted for this item.");
                    continue;
                }
            }
            if (inventoryWarnings.isEmpty()) {
                order.setInventoryAdjusted(true);
            }
        } else if (newStatus == Order.Status.CANCELLED && isInventoryAdjusted) {
            for (OrderItem item : order.getItems()) {
                Optional<Product> optionalProduct = productRepository.findById(item.getProductId());
                if (optionalProduct.isPresent()) {
                    Product product = optionalProduct.get();
                    int newQuantity = product.getQuantity() + item.getQuantity();
                    product.setQuantity(newQuantity);
                    productRepository.save(product);
                } else {
                    logger.warn("Product not found with ID: " + item.getProductId() + " during order cancellation.");
                    inventoryWarnings.add("Product not found with ID: " + item.getProductId() + ". Inventory not reverted for this item.");
                    continue;
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

        List<OrderItemDTO> itemDTOs = order.getItems().stream().map(item -> {
            OrderItemDTO itemDTO = new OrderItemDTO();
            itemDTO.setId(item.getId());
            itemDTO.setProductId(item.getProductId());
            itemDTO.setQuantity(item.getQuantity());
            return itemDTO;
        }).collect(Collectors.toList());
        orderDTO.setItems(itemDTOs);

        return orderDTO;
    }
}