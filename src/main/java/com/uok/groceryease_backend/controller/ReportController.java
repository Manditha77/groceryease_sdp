package com.uok.groceryease_backend.controller;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.uok.groceryease_backend.DTO.ReportDTO;
import com.uok.groceryease_backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // Helper method to determine date range based on time period
    private LocalDateTime[] calculateDateRange(String timePeriod, String startDateStr, String endDateStr) {
        LocalDateTime startDate = null;
        LocalDateTime endDate = LocalDateTime.now();

        if ("custom".equalsIgnoreCase(timePeriod) && startDateStr != null && endDateStr != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            startDate = LocalDateTime.parse(startDateStr + "T00:00:00");
            endDate = LocalDateTime.parse(endDateStr + "T23:59:59");
        } else if ("day".equalsIgnoreCase(timePeriod)) {
            startDate = endDate.minusDays(1);
        } else if ("month".equalsIgnoreCase(timePeriod)) {
            startDate = endDate.minusMonths(1);
        } else if ("year".equalsIgnoreCase(timePeriod)) {
            startDate = endDate.minusYears(1);
        } else if ("sofar".equalsIgnoreCase(timePeriod)) {
            startDate = null; // No filter, fetch all data
            endDate = null;
        }

        return new LocalDateTime[]{startDate, endDate};
    }

    @GetMapping("/{type}")
    public List<ReportDTO> getReport(
            @PathVariable String type,
            @RequestParam(value = "timePeriod", required = false, defaultValue = "sofar") String timePeriod,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate) {
        LocalDateTime[] dateRange = calculateDateRange(timePeriod, startDate, endDate);
        LocalDateTime start = dateRange[0];
        LocalDateTime end = dateRange[1];

        switch (type.toLowerCase()) {
            case "inventory":
                return reportService.generateInventoryStockReport(start, end);
            case "sales":
                return reportService.generateSalesPerformanceReport(start, end);
            case "productsales":
                return reportService.generateProductSalesReport(start, end);
            case "restock":
                return reportService.generateRestockHistoryReport(start, end);
            case "customer":
                return reportService.generateCustomerPurchaseReport(start, end);
            case "profit":
                return reportService.generateProfitabilityReport(start, end);
            default:
                throw new IllegalArgumentException("Unknown report type");
        }
    }

    @GetMapping("/{type}/export-pdf")
    public ResponseEntity<ByteArrayResource> exportReportToPDF(
            @PathVariable String type,
            @RequestParam(value = "timePeriod", required = false, defaultValue = "sofar") String timePeriod,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate) {
        List<ReportDTO> reportData = getReport(type, timePeriod, startDate, endDate);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Add Store Details at the top
            Paragraph storeDetails = new Paragraph()
                    .add(new Text("Samantha Store\n").setBold().setFontSize(14))
                    .add(new Text("Address: Colombo\n"))
                    .add(new Text("Contact: 0771234567"))
                    .setTextAlignment(TextAlignment.LEFT)
                    .setFontSize(10);
            document.add(storeDetails);

            // Add a line break
            document.add(new Paragraph("\n"));

            // Add Report Title (Centered)
            String title = type.toUpperCase() + " REPORT";
            Paragraph reportTitle = new Paragraph(title)
                    .setBold()
                    .setFontSize(18)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(reportTitle);

            // Add Date Range Information
            if (!"sofar".equalsIgnoreCase(timePeriod)) {
                LocalDateTime[] dateRange = calculateDateRange(timePeriod, startDate, endDate);
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                String dateRangeText = "Period: " + (startDate != null ? startDate : dateRange[0].format(formatter)) +
                        " to " + (endDate != null ? endDate : dateRange[1].format(formatter));
                document.add(new Paragraph(dateRangeText).setFontSize(10).setTextAlignment(TextAlignment.CENTER));
            }

            // Add a line break
            document.add(new Paragraph("\n"));

            if (reportData.isEmpty()) {
                document.add(new Paragraph("No data available for this report.").setTextAlignment(TextAlignment.CENTER));
            } else {
                switch (type.toLowerCase()) {
                    case "inventory":
                        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 2, 2, 2, 1, 2}));
                        table.setWidth(UnitValue.createPercentValue(100));
                        table.addHeaderCell(new Cell().add(new Paragraph("Product ID").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        table.addHeaderCell(new Cell().add(new Paragraph("Product Name").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        table.addHeaderCell(new Cell().add(new Paragraph("Category").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        table.addHeaderCell(new Cell().add(new Paragraph("Supplier").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        table.addHeaderCell(new Cell().add(new Paragraph("Total Quantity").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        table.addHeaderCell(new Cell().add(new Paragraph("Last Restock Date").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        for (ReportDTO dto : reportData) {
                            table.addCell(new Cell().add(new Paragraph(dto.getProductId().toString())));
                            table.addCell(new Cell().add(new Paragraph(dto.getProductName())));
                            table.addCell(new Cell().add(new Paragraph(dto.getCategoryName())));
                            table.addCell(new Cell().add(new Paragraph(dto.getSupplierName())));
                            table.addCell(new Cell().add(new Paragraph(String.valueOf(dto.getTotalQuantity()))));
                            table.addCell(new Cell().add(new Paragraph(dto.getLastRestockDate() != null ? dto.getLastRestockDate().toString() : "N/A")));
                        }
                        document.add(table);
                        break;

                    case "sales":
                        Table salesTable = new Table(UnitValue.createPercentArray(new float[]{2, 2, 1, 2, 2, 2}));
                        salesTable.setWidth(UnitValue.createPercentValue(100));
                        salesTable.addHeaderCell(new Cell().add(new Paragraph("Order Type").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        salesTable.addHeaderCell(new Cell().add(new Paragraph("Payment Method").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        salesTable.addHeaderCell(new Cell().add(new Paragraph("Total Orders").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        salesTable.addHeaderCell(new Cell().add(new Paragraph("Total Sales").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        salesTable.addHeaderCell(new Cell().add(new Paragraph("Earliest Order").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        salesTable.addHeaderCell(new Cell().add(new Paragraph("Latest Order").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        for (ReportDTO dto : reportData) {
                            salesTable.addCell(new Cell().add(new Paragraph(dto.getOrderType())));
                            salesTable.addCell(new Cell().add(new Paragraph(dto.getPaymentMethod())));
                            salesTable.addCell(new Cell().add(new Paragraph(String.valueOf(dto.getTotalOrders()))));
                            salesTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getTotalSales()))));
                            salesTable.addCell(new Cell().add(new Paragraph(dto.getEarliestOrderDate() != null ? dto.getEarliestOrderDate().toString() : "N/A")));
                            salesTable.addCell(new Cell().add(new Paragraph(dto.getLatestOrderDate() != null ? dto.getLatestOrderDate().toString() : "N/A")));
                        }
                        document.add(salesTable);
                        break;

                    case "productsales":
                        Table productSalesTable = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2, 2}));
                        productSalesTable.setWidth(UnitValue.createPercentValue(100));
                        productSalesTable.addHeaderCell(new Cell().add(new Paragraph("Product Name").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        productSalesTable.addHeaderCell(new Cell().add(new Paragraph("Category").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        productSalesTable.addHeaderCell(new Cell().add(new Paragraph("Total Units Sold").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        productSalesTable.addHeaderCell(new Cell().add(new Paragraph("Total Revenue").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        for (ReportDTO dto : reportData) {
                            productSalesTable.addCell(new Cell().add(new Paragraph(dto.getProductName())));
                            productSalesTable.addCell(new Cell().add(new Paragraph(dto.getCategoryName())));
                            productSalesTable.addCell(new Cell().add(new Paragraph(String.valueOf(dto.getTotalUnitsSold()))));
                            productSalesTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getTotalRevenue()))));
                        }
                        document.add(productSalesTable);
                        break;

                    case "restock":
                        Table restockTable = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2, 2, 2}));
                        restockTable.setWidth(UnitValue.createPercentValue(100));
                        restockTable.addHeaderCell(new Cell().add(new Paragraph("Product Name").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        restockTable.addHeaderCell(new Cell().add(new Paragraph("Supplier").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        restockTable.addHeaderCell(new Cell().add(new Paragraph("Quantity Restocked").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        restockTable.addHeaderCell(new Cell().add(new Paragraph("Buying Price").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        restockTable.addHeaderCell(new Cell().add(new Paragraph("Restock Date").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        for (ReportDTO dto : reportData) {
                            restockTable.addCell(new Cell().add(new Paragraph(dto.getProductName())));
                            restockTable.addCell(new Cell().add(new Paragraph(dto.getSupplierName())));
                            restockTable.addCell(new Cell().add(new Paragraph(String.valueOf(dto.getQuantityRestocked()))));
                            restockTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getBuyingPrice()))));
                            restockTable.addCell(new Cell().add(new Paragraph(dto.getLastRestockDate() != null ? dto.getLastRestockDate().toString() : "N/A")));
                        }
                        document.add(restockTable);
                        break;

                    case "customer":
                        Table customerTable = new Table(UnitValue.createPercentArray(new float[]{2, 1, 2, 2, 2}));
                        customerTable.setWidth(UnitValue.createPercentValue(100));
                        customerTable.addHeaderCell(new Cell().add(new Paragraph("Customer").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        customerTable.addHeaderCell(new Cell().add(new Paragraph("Total Orders").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        customerTable.addHeaderCell(new Cell().add(new Paragraph("Total Spent").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        customerTable.addHeaderCell(new Cell().add(new Paragraph("Last Order Date").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        customerTable.addHeaderCell(new Cell().add(new Paragraph("Order Types").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        for (ReportDTO dto : reportData) {
                            customerTable.addCell(new Cell().add(new Paragraph(dto.getCustomerUsername() != null ? dto.getCustomerUsername() : "N/A")));
                            customerTable.addCell(new Cell().add(new Paragraph(String.valueOf(dto.getTotalOrders()))));
                            customerTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getTotalSpent()))));
                            customerTable.addCell(new Cell().add(new Paragraph(dto.getLastOrderDate() != null ? dto.getLastOrderDate().toString() : "N/A")));
                            customerTable.addCell(new Cell().add(new Paragraph(dto.getOrderTypes() != null ? dto.getOrderTypes().replace(",", ", ") : "N/A")));
                        }
                        document.add(customerTable);
                        break;

                    case "profit":
                        Table profitTable = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2, 2, 2}));
                        profitTable.setWidth(UnitValue.createPercentValue(100));
                        profitTable.addHeaderCell(new Cell().add(new Paragraph("Product Name").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        profitTable.addHeaderCell(new Cell().add(new Paragraph("Total Units Sold").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        profitTable.addHeaderCell(new Cell().add(new Paragraph("Total Revenue").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        profitTable.addHeaderCell(new Cell().add(new Paragraph("Total Cost").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        profitTable.addHeaderCell(new Cell().add(new Paragraph("Profit").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        for (ReportDTO dto : reportData) {
                            profitTable.addCell(new Cell().add(new Paragraph(dto.getProductName())));
                            profitTable.addCell(new Cell().add(new Paragraph(String.valueOf(dto.getTotalUnitsSold()))));
                            profitTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getTotalRevenue()))));
                            profitTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getTotalCost()))));
                            profitTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getProfit()))));
                        }
                        document.add(profitTable);
                        break;

                    default:
                        document.add(new Paragraph("Report type not supported for PDF export.").setTextAlignment(TextAlignment.CENTER));
                }
            }

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error generating PDF for " + type + ": " + e.getMessage());
        }

        ByteArrayResource resource = new ByteArrayResource(baos.toByteArray());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=" + type + "_report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(baos.size())
                .body(resource);
    }
}