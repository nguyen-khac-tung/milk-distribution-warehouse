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
    }
}