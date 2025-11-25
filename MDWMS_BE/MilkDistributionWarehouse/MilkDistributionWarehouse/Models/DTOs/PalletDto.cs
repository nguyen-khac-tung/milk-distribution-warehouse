using MilkDistributionWarehouse.Models.Entities;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class PalletDto
    {
        public class PalletResponseDto
        {
            public string PalletId { get; set; }
            public string GoodsReceiptNoteId { get; set; }
            public int GoodsPackingId { get; set; }
            public int? UnitPerPackage { get; set; }
            public int PackageQuantity { get; set; }
            public int CreateBy { get; set; }
            public string CreateByName { get; set; }
            public Guid BatchId { get; set; }
            public string BatchCode { get; set; }
            public int GoodId { get; set; }
            public string GoodName { get; set; }
            public string GoodCode { get; set; }
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

            [Required(ErrorMessage = "Mã đơn kiểm nhập không được để trống")]
            public string? GoodsReceiptNoteId { get; set; }
        }

        public class PalletActiveDto
        {
            public string PalletId { get; set; }
        }

        public class PalletUpdateStatusDto
        {
            [Required(ErrorMessage = "PalletId không được để trống")]
            public string PalletId { get; set; }
            [Required]
            [Range(1, 3, ErrorMessage = "Status chỉ được phép là 1, 2 hoặc 3.")]
            public int Status { get; set; }
        }

        public class PalletUpdatePQuantityDto
        {
            [Required(ErrorMessage = "PalletId không được để trống")]
            public string PalletId { get; set; }
            [Required(ErrorMessage = "Số lượng hộp lấy ra không được để trống")]
            public int takeOutQuantity { get; set; }
        }

        public class PalletDetailDto
        {
            public string PalletId { get; set; }
            public string GoodsReceiptNoteId { get; set; }
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
            public string UnitOfMeasure { get; set; }
        }

        public class PalletBulkCreate
        {
            [Required(ErrorMessage = "Danh sách pallet không được rỗng")]
            [MinLength(1, ErrorMessage = "Danh sách pallet không được rỗng")]
            [MaxLength(1000, ErrorMessage = "Số lượng pallet tối đa 1000")]
            public List<PalletRequestDto> Pallets { get; set; } = new();
        }

        public class PalletBulkResponse
        {
            public int TotalInserted { get; set; }
            public int TotalFailed { get; set; }
            public List<FailedItem> FailedItems { get; set; } = new();
        }

        public class FailedItem
        {
            public int Index { get; set; }
            public string Code { get; set; } = string.Empty;
            public string Error { get; set; } = string.Empty;
        }
    }
}
