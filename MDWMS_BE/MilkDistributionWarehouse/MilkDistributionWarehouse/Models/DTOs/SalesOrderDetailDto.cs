using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class SalesOrderDetailDto
    {
        public int SalesOrderDetailId { get; set; }

        public Guid? SalesOrderId { get; set; }

        public GoodsDto Goods { get; set; }

        public int? Quantity { get; set; }
    }
}
