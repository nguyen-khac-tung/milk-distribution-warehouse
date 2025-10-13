using System.ComponentModel.DataAnnotations;
using MilkDistributionWarehouse.Constants;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class AreaDto
    {
        public class AreaResponseDto
        {
            public int AreaId { get; set; }
            public string AreaName { get; set; }
            public string AreaCode { get; set; }
            public string Description { get; set; }
            public int StorageConditionId { get; set; }
            public int Status { get; set; }
            public DateTime? CreatedAt { get; set; }
            public DateTime? UpdateAt { get; set; }
        }

        public class AreaDetailDto
        {
            public int AreaId { get; set; }
            public string AreaName { get; set; }
            public string AreaCode { get; set; }
            public string Description { get; set; }
            public int StorageConditionId { get; set; }
            public int Status { get; set; }
            public decimal TemperatureMin { get; set; }
            public decimal TemperatureMax { get; set; }
            public decimal HumidityMin { get; set; }
            public decimal HumidityMax { get; set; }
            public string LightLevel { get; set; }
            public DateTime? CreatedAt { get; set; }
            public DateTime? UpdateAt { get; set; }
        }

        public class AreaRequestDto
        {
            [Required(ErrorMessage = "Tên khu vực không được để trống")]
            [StringLength(100, ErrorMessage = "Tên khu vực không được vượt quá 100 ký tự")]
            public string AreaName { get; set; }

            [Required(ErrorMessage = "Mã khu vực không được để trống")]
            [StringLength(50, ErrorMessage = "Mã khu vực không được vượt quá 50 ký tự")]
            [RegularExpression(@"^[A-Za-z0-9_-]+$", ErrorMessage = "Mã khu vực chỉ được chứa chữ, số, dấu gạch dưới hoặc gạch ngang")]
            public string AreaCode { get; set; }

            [StringLength(255, ErrorMessage = "Mô tả không được vượt quá 255 ký tự")]
            public string Description { get; set; }

            [Required(ErrorMessage = "StorageConditionId không được để trống")]
            [Range(1, int.MaxValue, ErrorMessage = "StorageConditionId phải là số nguyên dương")]
            public int StorageConditionId { get; set; }
        }

        public class AreaNameDto
        {
            public string AreaName { get; set; }
        }
    }
}
