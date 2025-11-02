using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class PickAllocationDto
    {
        public int PickAllocationId { get; set; }
        public int PickPackageQuantity { get; set; }
        public string? LocationCode { get; set; }
        public string Rack { get; set; }
        public int? Row { get; set; }
        public int? Column { get; set; }
        public string? AreaName { get; set; }
        public int Status { get; set; }
    }

    public class PickAllocationDetailDto
    {
        public int PickAllocationId { get; set; }
        public string? PalletId { get; set; }
        public string? GoodsName { get; set; }
        public string? BatchCode { get; set; }
        public DateOnly? ExpiryDate { get; set; }
        public int? UnitPerPackage { get; set; }
        public int? PalletPackageQuantity { get; set; }
        public int? PickPackageQuantity { get; set; }
        public int Status { get; set; }
    }

    public class ConfirmPickAllocationDto
    {
        [Required(ErrorMessage = "Mã phân bổ lấy hàng không được để trống.")]
        public int? PickAllocationId { get; set; }

        [Required(ErrorMessage = "Mã kệ kê hàng không được bỏ trống.")]
        public string? PalletId { get; set; }
    }
}
