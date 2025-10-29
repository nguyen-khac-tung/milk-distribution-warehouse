using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class PurchaseOrderDetailDto
    {
        public int PurchaseOrderDetailId { get; set; }
        public Guid PurchaseOderId { get; set; }
        public int GoodsId { get; set; }
        public string GoodsCode { get; set; }
        public string GoodsName { get; set; }
        public int GoodsPackingId { get; set; }
        public int UnitPerPacking { get; set; }
        public int PackageQuantity { get; set; }
        public string UnitMeasureName { get; set; } 
    }

    public class PurchaseOrderDetailCreate
    {
        [Required(ErrorMessage = "Hàng hoá không được bỏ trống.")]
        public int GoodsId { get; set; }
        [Required(ErrorMessage = "Số lượng hàng hoá không được bỏ trống.")]
        public int GoodsPackingId { get; set; }
        [Required(ErrorMessage = "Số lượng không được bỏ trống.")]
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0.")]
        public int PackageQuantity { get; set; }
    }

    public class PurchaseOrderDetailUpdate : PurchaseOrderDetailCreate
    {
        public int PurchaseOrderDetailId { get; set; }
    }
}
