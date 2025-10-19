using System.ComponentModel.DataAnnotations;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class LocationDto
    {
        public class LocationResponseDto
        {
            public int LocationId { get; set; }

            public int AreaId { get; set; }

            public string AreaName { get; set; }

            public string LocationCode { get; set; }

            public string Rack { get; set; }

            public int Row { get; set; }

            public int Column { get; set; }

            public bool IsAvailable { get; set; }

            public int Status { get; set; }

            public DateTime? CreatedAt { get; set; }

            public DateTime? UpdateAt { get; set; }
        }

        public class LocationActiveDto
        {
            public int LocationId { get; set; }

            public string LocationCode { get; set; }
        }

        public class LocationRequestDto
        {
            [Required(ErrorMessage = "Chưa chọn khu vực!")]
            [Range(1, int.MaxValue, ErrorMessage = "Khu vực không hợp lệ!")]
            public int AreaId { get; set; }

            [Required(ErrorMessage = "Rack không được để trống")]
            [StringLength(20, ErrorMessage = "Rack không được vượt quá 20 ký tự!")]
            public string Rack { get; set; }

            [Required(ErrorMessage = "Hàng không được để trống")]
            [Range(1, 1000, ErrorMessage = "Số hàng (Row) phải >= 1 và < 1000")]
            public int Row { get; set; }

            [Required(ErrorMessage = "Cột không được để trống")]
            [Range(1, 1000, ErrorMessage = "Số cột (Column) phải >= 1 và < 1000")]
            public int Column { get; set; }

            public bool? IsAvailable { get; set; } = true;
        }

        public class LocationBulkCreate
        {
            [Required(ErrorMessage = "Danh sách vị trí không được rỗng")]
            [MinLength(1, ErrorMessage = "Danh sách vị trí không được rỗng")]
            [MaxLength(1000, ErrorMessage = "Số lượng vị trí tối đa 1000")]
            public List<LocationRequestDto> Locations { get; set; } = new();
        }

        public class LocationBulkResponse
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
