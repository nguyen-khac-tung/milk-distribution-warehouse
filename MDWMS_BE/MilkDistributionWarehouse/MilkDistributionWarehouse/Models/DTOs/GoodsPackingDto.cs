namespace MilkDistributionWarehouse.Models.DTOs
{
    public class GoodsPackingDto
    {
        public int GoodsPackingId { get; set; }
        public int UnitPerPackage { get; set; }
    }

    public class GoodsPackingCreate
    {
        public int UnitPerPackage { get; set; }
    }

}
