using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class PalletDto
    {
        public class PalletResponseDto
        {
            public Guid PalletId { get; set; }
            public Guid PurchaseOrderId { get; set; }
            public int PackageQuantity { get; set; }
            public int UnitsPerPackage { get; set; }
            public int CreateBy { get; set; }
            public string CreateByName { get; set; }
            public Guid BatchId { get; set; }
            public string BatchCode { get; set; }
            public int LocationId { get; set; }
            public string LocationCode { get; set; }
            public int Status { get; set; }
        }

        public class PalletRequestDto
        {
            [Required(ErrorMessage = "BatchId không được để trống")]
            public Guid BatchId { get; set; }

            [Required(ErrorMessage = "LocationId không được để trống")]
            [Range(1, int.MaxValue, ErrorMessage = "LocationId phải là số nguyên dương")]
            public int LocationId { get; set; }

            [Required(ErrorMessage = "Số lượng kiện không được để trống")]
            [Range(1, int.MaxValue, ErrorMessage = "PackageQuantity phải lớn hơn 0")]
            public int PackageQuantity { get; set; }

            [Required(ErrorMessage = "Số đơn vị mỗi kiện không được để trống")]
            [Range(1, int.MaxValue, ErrorMessage = "UnitsPerPackage phải lớn hơn 0")]
            public int UnitsPerPackage { get; set; }

            public Guid? PurchaseOrderId { get; set; }
        }

        public class PalletActiveDto
        {
            public Guid PalletId { get; set; }
            public string DisplayName { get; set; }
        }
    }
}
