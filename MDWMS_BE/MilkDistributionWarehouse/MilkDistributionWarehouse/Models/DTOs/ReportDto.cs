using System;
using System.Collections.Generic;
using static MilkDistributionWarehouse.Models.DTOs.LocationDto;
using static MilkDistributionWarehouse.Models.DTOs.PalletDto;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class ReportDto
    {
        public class InventoryReportDto
        {
            public Guid BatchId { get; set; }
            public string BatchCode { get; set; }
            public DateOnly? ManufacturingDate { get; set; }
            public DateOnly? ExpiryDate { get; set; }
            public string GoodsCode { get; set; }
            public string GoodName { get; set; }
            public int SupplierId { get; set; }
            public string CompanyName { get; set; }
            public int GoodsPackingId { get; set; }
            public string UnitPerPackage { get; set; }
            public string UnitOfMeasure { get; set; }
            public List<PalletResponseDto> Pallets { get; set; } = new();
            public int TotalPackageQuantity { get; set; }
            public List<LocationResponseDto> Locations { get; set; } = new();
        }

        public class LocationReportDto
        {
            public int AreaId { get; set; }
            public string AreaName { get; set; }
            public int TotalLocations { get; set; }
            public int AvailableLocationCount { get; set; }
        }

        public class LocationReportSummaryDto
        {
            public int TotalLocations { get; set; }
            public int AvailableLocationCount { get; set; }
            public List<LocationReportDto> AreaDetails { get; set; } = new();
        }

        public class SaleBySupplierReportDto
        {
            public int SupplierId { get; set; }
            public string CompanyName { get; set; }
            public int GoodsId { get; set; }
            public string GoodCode { get; set; }
            public string GoodName { get; set; }
            public int GoodsPackingId { get; set; }
            public string UnitPerPackage { get; set; }
            public int totalPackagesSold { get; set; }
        }

        public class GoodsReceiptReportDto
        {
            public int SupplierId { get; set; }
            public string SupplierName { get; set; }
            public string PurchaseOderId { get; set; }
            public int GoodsId { get; set; }
            public string GoodsCode { get; set; }
            public string GoodsName { get; set; }
            public string UnitOfMeasure { get; set; }
            public int GoodsPackingId { get; set; }
            public int? UnitPerPackage { get; set; }
            public DateTime? ReceiptDate { get; set; }
            public int TotalPackageQuantity { get; set; }
            public int TotalUnitQuantity { get; set; }
        }

        public class GoodIssueReportDto
        {
            public int SupplierId { get; set; }
            public string SupplierName { get; set; }
            public int RetailerId { get; set; }
            public string RetailerName { get; set; }
            public string SalesOderId { get; set; }
            public int GoodsId { get; set; }
            public string GoodsCode { get; set; }
            public string GoodsName { get; set; }
            public string UnitOfMeasure { get; set; }
            public int GoodsPackingId { get; set; }
            public int? UnitPerPackage { get; set; }
            public DateTime? IssueDate { get; set; }
            public int TotalPackageQuantity { get; set; }
            public int TotalUnitQuantity { get; set; }  
        }

        public class InventoryLedgerReportDto
        {
            public int GoodsId { get; set; }
            public string GoodsCode { get; set; }
            public string GoodsName { get; set; }
            public string UnitOfMeasure { get; set; }
            public int GoodPackingId { get; set; }
            public int? UnitPerPackage { get; set; }
            public int BeginningInventoryPackages { get; set; }
            public int InQuantityPackages { get; set; }
            public int OutQuantityPackages { get; set; }
            public int EndingInventoryPackages { get; set; }
        }
    }
}