using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class GoodsPackingDto
    {
        public int GoodsPackingId { get; set; }
        public int UnitPerPackage { get; set; }
    }

    public class GoodsPackingCreate
    {
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng đơn vị trong một gói phải lớn hơn 0.")]
        public int UnitPerPackage { get; set; }
    }

    public class GoodsPackingUpdate : GoodsPackingDto { }
}
