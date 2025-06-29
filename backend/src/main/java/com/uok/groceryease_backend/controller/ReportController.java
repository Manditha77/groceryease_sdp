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
            startDate = null;
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

            // Add Store Details and Generation Date
            Paragraph storeDetails = new Paragraph()
                    .add(new Text("Samantha Store\n").setBold().setFontSize(14))
                    .add(new Text("Address: 33/23, Gaminipura - Meegoda\n"))
                    .add(new Text("Contact: 0772235273"))
                    .setTextAlignment(TextAlignment.LEFT)
                    .setFontSize(10);
            Paragraph generationDate = new Paragraph("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(10);
            document.add(storeDetails);
            document.add(generationDate);

            document.add(new Paragraph("\n"));

            // Add Report Title
            String title = type.toUpperCase() + " REPORT";
            Paragraph reportTitle = new Paragraph(title)
                    .setBold()
                    .setFontSize(18)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(reportTitle);

            // Add Date Range Information
            LocalDateTime[] dateRange = calculateDateRange(timePeriod, startDate, endDate);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            String dateRangeText = "Period: " + (startDate != null ? startDate : (dateRange[0] != null ? dateRange[0].format(formatter) : "Beginning")) +
                    " to " + (endDate != null ? endDate : (dateRange[1] != null ? dateRange[1].format(formatter) : "Present"));
            document.add(new Paragraph(dateRangeText).setFontSize(10).setTextAlignment(TextAlignment.CENTER));

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
                            table.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getTotalQuantity()))));
                            table.addCell(new Cell().add(new Paragraph(dto.getLastRestockDate() != null ? dto.getLastRestockDate().toString() : "N/A")));
                        }
                        document.add(table);
                        document.add(new Paragraph("\nSummary").setBold().setFontSize(12));
                        double totalQuantity = reportData.stream().mapToDouble(ReportDTO::getTotalQuantity).sum();
                        document.add(new Paragraph("Total Quantity in Stock: " + String.format("%.2f", totalQuantity)).setFontSize(10));
                        break;

                    case "sales":
                        Table salesTable = new Table(UnitValue.createPercentArray(new float[]{2, 2, 1, 2, 2, 2}));
                        salesTable.setWidth(UnitValue.createPercentValue(100));
                        salesTable.addHeaderCell(new Cell().add(new Paragraph("Order Type").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        salesTable.addHeaderCell(new Cell().add(new Paragraph("Payment Method").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        salesTable.addHeaderCell(new Cell().add(new Paragraph("Total Orders").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        salesTable.addHeaderCell(new Cell().add(new Paragraph("Total Sales Rs.").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
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
                        document.add(new Paragraph("\nSummary").setBold().setFontSize(12));
                        long totalOrders = reportData.stream().mapToLong(ReportDTO::getTotalOrders).sum();
                        double totalSales = reportData.stream().mapToDouble(ReportDTO::getTotalSales).sum();
                        document.add(new Paragraph("Total Orders: " + totalOrders).setFontSize(10));
                        document.add(new Paragraph("Total Sales: Rs." + String.format("%.2f", totalSales)).setFontSize(10));
                        break;

                    case "productsales":
                        Table productSalesTable = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2, 2}));
                        productSalesTable.setWidth(UnitValue.createPercentValue(100));
                        productSalesTable.addHeaderCell(new Cell().add(new Paragraph("Product Name").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        productSalesTable.addHeaderCell(new Cell().add(new Paragraph("Category").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        productSalesTable.addHeaderCell(new Cell().add(new Paragraph("Total Units Sold").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        productSalesTable.addHeaderCell(new Cell().add(new Paragraph("Total Revenue Rs.").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        for (ReportDTO dto : reportData) {
                            productSalesTable.addCell(new Cell().add(new Paragraph(dto.getProductName())));
                            productSalesTable.addCell(new Cell().add(new Paragraph(dto.getCategoryName())));
                            productSalesTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getTotalUnitsSold()))));
                            productSalesTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getTotalRevenue()))));
                        }
                        document.add(productSalesTable);
                        document.add(new Paragraph("\nSummary").setBold().setFontSize(12));
                        double totalUnitsSold = reportData.stream().mapToDouble(ReportDTO::getTotalUnitsSold).sum();
                        double totalRevenue = reportData.stream().mapToDouble(ReportDTO::getTotalRevenue).sum();
                        document.add(new Paragraph("Total Units Sold: " + String.format("%.2f", totalUnitsSold)).setFontSize(10));
                        document.add(new Paragraph("Total Revenue: Rs." + String.format("%.2f", totalRevenue)).setFontSize(10));
                        break;

                    case "restock":
                        Table restockTable = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2, 2, 2}));
                        restockTable.setWidth(UnitValue.createPercentValue(100));
                        restockTable.addHeaderCell(new Cell().add(new Paragraph("Product Name").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        restockTable.addHeaderCell(new Cell().add(new Paragraph("Supplier").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        restockTable.addHeaderCell(new Cell().add(new Paragraph("Quantity Restocked").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        restockTable.addHeaderCell(new Cell().add(new Paragraph("Buying Price Rs.").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        restockTable.addHeaderCell(new Cell().add(new Paragraph("Restock Date").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        for (ReportDTO dto : reportData) {
                            restockTable.addCell(new Cell().add(new Paragraph(dto.getProductName())));
                            restockTable.addCell(new Cell().add(new Paragraph(dto.getSupplierName())));
                            restockTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getQuantityRestocked()))));
                            restockTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getBuyingPrice()))));
                            restockTable.addCell(new Cell().add(new Paragraph(dto.getLastRestockDate() != null ? dto.getLastRestockDate().toString() : "N/A")));
                        }
                        document.add(restockTable);
                        document.add(new Paragraph("\nSummary").setBold().setFontSize(12));
                        double totalQuantityRestocked = reportData.stream().mapToDouble(ReportDTO::getQuantityRestocked).sum();
                        double totalCost = reportData.stream().mapToDouble(dto -> dto.getQuantityRestocked() * dto.getBuyingPrice()).sum();
                        document.add(new Paragraph("Total Quantity Restocked: " + String.format("%.2f", totalQuantityRestocked)).setFontSize(10));
                        document.add(new Paragraph("Total Cost: Rs." + String.format("%.2f", totalCost)).setFontSize(10));
                        break;

                    case "customer":
                        Table customerTable = new Table(UnitValue.createPercentArray(new float[]{2, 1, 2, 2, 2}));
                        customerTable.setWidth(UnitValue.createPercentValue(100));
                        customerTable.addHeaderCell(new Cell().add(new Paragraph("Customer").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        customerTable.addHeaderCell(new Cell().add(new Paragraph("Total Orders").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        customerTable.addHeaderCell(new Cell().add(new Paragraph("Total Spent Rs.").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
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
                        document.add(new Paragraph("\nSummary").setBold().setFontSize(12));
                        long totalCustomerOrders = reportData.stream().mapToLong(ReportDTO::getTotalOrders).sum();
                        double totalSpent = reportData.stream().mapToDouble(ReportDTO::getTotalSpent).sum();
                        document.add(new Paragraph("Total Orders: " + totalCustomerOrders).setFontSize(10));
                        document.add(new Paragraph("Total Spent: Rs." + String.format("%.2f", totalSpent)).setFontSize(10));
                        break;

                    case "profit":
                        Table profitTable = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2, 2, 2}));
                        profitTable.setWidth(UnitValue.createPercentValue(100));
                        profitTable.addHeaderCell(new Cell().add(new Paragraph("Product Name").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        profitTable.addHeaderCell(new Cell().add(new Paragraph("Total Units Sold").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        profitTable.addHeaderCell(new Cell().add(new Paragraph("Total Revenue Rs.").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        profitTable.addHeaderCell(new Cell().add(new Paragraph("Total Cost Rs.").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        profitTable.addHeaderCell(new Cell().add(new Paragraph("Profit Rs.").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
                        for (ReportDTO dto : reportData) {
                            profitTable.addCell(new Cell().add(new Paragraph(dto.getProductName())));
                            profitTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getTotalUnitsSold()))));
                            profitTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getTotalRevenue()))));
                            profitTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getTotalCost()))));
                            profitTable.addCell(new Cell().add(new Paragraph(String.format("%.2f", dto.getProfit()))));
                        }
                        document.add(profitTable);
                        document.add(new Paragraph("\nSummary").setBold().setFontSize(12));
                        double totalUnitsSoldProfit = reportData.stream().mapToDouble(ReportDTO::getTotalUnitsSold).sum();
                        double totalRevenueProfit = reportData.stream().mapToDouble(ReportDTO::getTotalRevenue).sum();
                        double totalCostProfit = reportData.stream().mapToDouble(ReportDTO::getTotalCost).sum();
                        double totalProfit = reportData.stream().mapToDouble(ReportDTO::getProfit).sum();
                        document.add(new Paragraph("Total Units Sold: " + String.format("%.2f", totalUnitsSoldProfit)).setFontSize(10));
                        document.add(new Paragraph("Total Revenue: Rs." + String.format("%.2f", totalRevenueProfit)).setFontSize(10));
                        document.add(new Paragraph("Total Cost: Rs." + String.format("%.2f", totalCostProfit)).setFontSize(10));
                        document.add(new Paragraph("Total Profit: Rs." + String.format("%.2f", totalProfit)).setFontSize(10));
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