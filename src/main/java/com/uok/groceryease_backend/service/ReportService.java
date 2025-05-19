package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DTO.ReportDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private EntityManager entityManager;

    // Helper method to append date filter to JPQL/SQL queries
    private String appendDateFilter(String query, String dateField, LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate != null && endDate != null) {
            return query + " AND " + dateField + " BETWEEN :startDate AND :endDate";
        }
        return query;
    }

    // 1. Inventory Stock Report
    public List<ReportDTO> generateInventoryStockReport(LocalDateTime startDate, LocalDateTime endDate) {
        String baseJpql = "SELECT p.productId, p.productName, p.category.categoryName, p.supplier.companyName, " +
                "COALESCE((SELECT SUM(b.units) FROM p.batches b), 0) as totalUnits, " +
                "(SELECT MAX(b.createdDate) FROM p.batches b) as lastRestockDate " +
                "FROM Product p " +
                "LEFT JOIN p.category " +
                "LEFT JOIN p.supplier " +
                "GROUP BY p.productId, p.productName, p.category.categoryName, p.supplier.companyName";

        String jpql = baseJpql;
        if (startDate != null || endDate != null) {
            jpql += " HAVING (";
            if (startDate != null) {
                jpql += "(SELECT MIN(b.createdDate) FROM p.batches b) >= :startDate";
                if (endDate != null) jpql += " AND ";
            }
            if (endDate != null) {
                jpql += "(SELECT MAX(b.createdDate) FROM p.batches b) <= :endDate";
            }
            jpql += ")";
        }

        Query query = entityManager.createQuery(jpql, Object[].class);
        if (startDate != null) query.setParameter("startDate", startDate);
        if (endDate != null) query.setParameter("endDate", endDate);

        List<Object[]> results = query.getResultList();

        return results.stream().map(result -> {
            ReportDTO dto = new ReportDTO();
            dto.setProductId((Long) result[0]);
            dto.setProductName((String) result[1]);
            dto.setCategoryName((String) result[2]);
            dto.setSupplierName((String) result[3]);
            dto.setTotalQuantity(((Number) result[4]).doubleValue());
            dto.setLastRestockDate((LocalDateTime) result[5]);
            return dto;
        }).collect(Collectors.toList());
    }

    // 2. Sales Performance Report
    public List<ReportDTO> generateSalesPerformanceReport(LocalDateTime startDate, LocalDateTime endDate) {
        String jpql = "SELECT o.orderType, o.paymentMethod, " +
                "COUNT(o.orderId) as totalOrders, " +
                "SUM(o.totalAmount) as totalSales, " +
                "MIN(o.orderDate) as earliestDate, " +
                "MAX(o.orderDate) as latestDate " +
                "FROM Order o " +
                "WHERE o.status = 'COMPLETED' ";
        jpql = appendDateFilter(jpql, "o.orderDate", startDate, endDate);
        jpql += " GROUP BY o.orderType, o.paymentMethod";

        Query query = entityManager.createQuery(jpql, Object[].class);
        if (startDate != null && endDate != null) {
            query.setParameter("startDate", startDate);
            query.setParameter("endDate", endDate);
        }
        List<Object[]> results = query.getResultList();

        return results.stream().map(result -> {
            ReportDTO dto = new ReportDTO();
            Object orderTypeObj = result[0];
            String orderType = (orderTypeObj != null) ? ((Enum<?>) orderTypeObj).name() : null;
            dto.setOrderType(orderType);
            dto.setPaymentMethod((String) result[1]);
            dto.setTotalOrders(((Number) result[2]).longValue());
            dto.setTotalSales(((Number) result[3]).doubleValue());
            dto.setEarliestOrderDate((LocalDateTime) result[4]);
            dto.setLatestOrderDate((LocalDateTime) result[5]);
            return dto;
        }).collect(Collectors.toList());
    }

    // 3. Product Sales Report
    public List<ReportDTO> generateProductSalesReport(LocalDateTime startDate, LocalDateTime endDate) {
        String jpql = "SELECT p.productId, p.productName, p.category.categoryName, " +
                "SUM(oi.units) as totalUnitsSold, " +
                "SUM(oi.units * oi.sellingPrice) as totalRevenue " +
                "FROM OrderItem oi " +
                "JOIN oi.order o " +
                "JOIN Product p ON oi.productId = p.productId " +
                "LEFT JOIN p.category " +
                "WHERE o.status = 'COMPLETED' ";
        jpql = appendDateFilter(jpql, "o.orderDate", startDate, endDate);
        jpql += " GROUP BY p.productId, p.productName, p.category.categoryName";

        Query query = entityManager.createQuery(jpql, Object[].class);
        if (startDate != null && endDate != null) {
            query.setParameter("startDate", startDate);
            query.setParameter("endDate", endDate);
        }
        List<Object[]> results = query.getResultList();

        return results.stream().map(result -> {
            ReportDTO dto = new ReportDTO();
            dto.setProductId((Long) result[0]);
            dto.setProductName((String) result[1]);
            dto.setCategoryName((String) result[2]);
            dto.setTotalUnitsSold(((Number) result[3]).doubleValue());
            dto.setTotalRevenue(((Number) result[4]).doubleValue());
            return dto;
        }).collect(Collectors.toList());
    }

    // 4. Restock History Report
    public List<ReportDTO> generateRestockHistoryReport(LocalDateTime startDate, LocalDateTime endDate) {
        String baseJpql = "SELECT p.productId, p.productName, p.supplier.companyName, " +
                "b.units, b.buyingPrice, b.createdDate " +
                "FROM Product p, IN(p.batches) b " +
                "JOIN p.supplier ";

        String jpql = baseJpql;
        if (startDate != null || endDate != null) {
            jpql += "WHERE ";
            if (startDate != null) {
                jpql += "b.createdDate >= :startDate";
                if (endDate != null) jpql += " AND ";
            }
            if (endDate != null) {
                jpql += "b.createdDate <= :endDate";
            }
        }
        jpql += " ORDER BY b.createdDate DESC";

        Query query = entityManager.createQuery(jpql, Object[].class);
        if (startDate != null) query.setParameter("startDate", startDate);
        if (endDate != null) query.setParameter("endDate", endDate);

        List<Object[]> results = query.getResultList();

        return results.stream().map(result -> {
            ReportDTO dto = new ReportDTO();
            dto.setProductId((Long) result[0]);
            dto.setProductName((String) result[1]);
            dto.setSupplierName((String) result[2]);
            dto.setQuantityRestocked(((Number) result[3]).doubleValue());
            dto.setBuyingPrice(((Number) result[4]).doubleValue());
            dto.setLastRestockDate((LocalDateTime) result[5]);
            return dto;
        }).collect(Collectors.toList());
    }

    // 5. Customer Purchase Report
    public List<ReportDTO> generateCustomerPurchaseReport(LocalDateTime startDate, LocalDateTime endDate) {
        String sql = "SELECT o.username, " +
                "COUNT(o.order_id) as totalOrders, " +
                "SUM(o.total_amount) as totalSpent, " +
                "MAX(o.order_date) as lastOrderDate, " +
                "GROUP_CONCAT(DISTINCT o.order_type) as orderTypes " +
                "FROM orders o " +
                "WHERE o.status = 'COMPLETED' ";
        if (startDate != null && endDate != null) {
            sql += "AND o.order_date BETWEEN :startDate AND :endDate ";
        }
        sql += "GROUP BY o.username";

        Query query = entityManager.createNativeQuery(sql);
        if (startDate != null && endDate != null) {
            query.setParameter("startDate", startDate);
            query.setParameter("endDate", endDate);
        }
        List<Object[]> results = query.getResultList();

        return results.stream().map(result -> {
            ReportDTO dto = new ReportDTO();
            dto.setCustomerUsername((String) result[0]);
            dto.setTotalOrders(((Number) result[1]).longValue());
            dto.setTotalSpent(((Number) result[2]).doubleValue());
            Object lastOrderDateObj = result[3];
            LocalDateTime lastOrderDate = (lastOrderDateObj != null) ? ((Timestamp) lastOrderDateObj).toLocalDateTime() : null;
            dto.setLastOrderDate(lastOrderDate);
            dto.setOrderTypes((String) result[4]);
            return dto;
        }).collect(Collectors.toList());
    }

    // 6. Profitability Report
    public List<ReportDTO> generateProfitabilityReport(LocalDateTime startDate, LocalDateTime endDate) {
        String jpql = "SELECT p.productId, p.productName, " +
                "SUM(oi.units) as totalUnitsSold, " +
                "SUM(oi.units * oi.sellingPrice) as totalRevenue, " +
                "SUM(CASE WHEN oi.batch IS NOT NULL THEN oi.units * oi.batch.buyingPrice ELSE 0 END) as totalCost " +
                "FROM OrderItem oi " +
                "JOIN oi.order o " +
                "JOIN Product p ON oi.productId = p.productId " +
                "WHERE o.status = 'COMPLETED' ";
        jpql = appendDateFilter(jpql, "o.orderDate", startDate, endDate);
        jpql += " GROUP BY p.productId, p.productName";

        Query query = entityManager.createQuery(jpql, Object[].class);
        if (startDate != null && endDate != null) {
            query.setParameter("startDate", startDate);
            query.setParameter("endDate", endDate);
        }
        List<Object[]> results = query.getResultList();

        return results.stream().map(result -> {
            ReportDTO dto = new ReportDTO();
            dto.setProductId((Long) result[0]);
            dto.setProductName((String) result[1]);
            dto.setTotalUnitsSold(((Number) result[2]).doubleValue());
            dto.setTotalRevenue(((Number) result[3]).doubleValue());
            double totalCost = ((Number) result[4]).doubleValue();
            dto.setTotalCost(totalCost);
            dto.setProfit(dto.getTotalRevenue() - totalCost);
            return dto;
        }).collect(Collectors.toList());
    }
}