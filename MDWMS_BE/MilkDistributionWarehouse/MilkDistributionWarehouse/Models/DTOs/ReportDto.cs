using System;
using System.Collections.Generic;

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
            public List<string> PalletIds { get; set; } = new();
            public int TotalPackageQuantity { get; set; }
            public List<string> LocationCodes { get; set; } = new();
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
    }
}