namespace MilkDistributionWarehouse.Models.DTOs
{
    public class PurchaseOrderDetailDto
    {
        public int GoodsId { get; set; }
        public string GoodsName { get; set; }
        public int Quantity { get; set; }
    }



    public class PurchaseOrderDetailCreate
    {
        public int GoodsId { get; set; }
        public int Quantity { get; set; }
    }

}
