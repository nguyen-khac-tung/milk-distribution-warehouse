using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class SupplierDto
    {
        public int SupplierId { get; set; }

        public string CompanyName { get; set; }

        public string BrandName { get; set; }

        public int Status { get; set; }
    }
}
