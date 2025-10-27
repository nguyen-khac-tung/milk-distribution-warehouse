using MilkDistributionWarehouse.Models.Entities;
using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class PalletDto
    {
        public class PalletResponseDto
        {
            public Guid PalletId { get; set; }
            public Guid GoodsReceiptNoteId { get; set; }
            public int GoodsPackingId { get; set; }
            public int? UnitPerPackage { get; set; }
            public int PackageQuantity { get; set; }
            public int CreateBy { get; set; }
            public string CreateByName { get; set; }
            public Guid BatchId { get; set; }
            public string BatchCode { get; set; }
            public int GoodId { get; set; }
            public int LocationId { get; set; }
            public string LocationCode { get; set; }
            public int Status { get; set; }
        }

        public class PalletRequestDto
        {
            [Required(ErrorMessage = "BatchId không được để trống")]
            public Guid BatchId { get; set; }

            [Range(1, int.MaxValue, ErrorMessage = "LocationId phải là số nguyên dương")]
            public int? LocationId { get; set; }

            [Required(ErrorMessage = "Số lượng kiện không được để trống")]
            [Range(1, int.MaxValue, ErrorMessage = "PackageQuantity phải lớn hơn 0")]
            public int PackageQuantity { get; set; }

            [Required(ErrorMessage = "Phương thức đóng hộp không được để trống")]
            public int GoodsPackingId { get; set; }

            public Guid? GoodsReceiptNoteId { get; set; }
        }

        public class PalletActiveDto
        {
            public Guid PalletId { get; set; }
        }

        public class PalletUpdateStatusDto
        {
            [Required]
            public Guid PalletId { get; set; }
            [Required]
            [Range(1, 3, ErrorMessage = "Status chỉ được phép là 1, 2 hoặc 3.")]
            public int Status { get; set; }
        }

        public class PalletDetailDto
        {
            public Guid PalletId { get; set; }
            public Guid GoodsReceiptNoteId { get; set; }
            public int PackageQuantity { get; set; }
            public int GoodsPackingId { get; set; }
            public int UnitPerPackage { get; set; }
            public int CreateBy { get; set; }
            public string CreateByName { get; set; }
            public Guid BatchId { get; set; }
            public string BatchCode { get; set; }
            public int LocationId { get; set; }
            public string LocationCode { get; set; }
            public int Status { get; set; }
            public DateOnly ManufacturingDate { get; set; }
            public DateOnly ExpiryDate { get; set; }
            public string GoodsName { get; set; }
            public string AreaName { get; set; }
            public string AreaCode { get; set; }
        }
    }
}
