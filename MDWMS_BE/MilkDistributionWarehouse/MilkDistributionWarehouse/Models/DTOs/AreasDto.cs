using System.ComponentModel.DataAnnotations;

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

            public int? Status { get; set; }

            public DateTime? CreatedAt { get; set; }

            public DateTime? UpdateAt { get; set; }
        }

        public class AreaRequestDto
        {
            [Required(ErrorMessage = "Tên khu vực không được để trống")]
            public string AreaName { get; set; }

            [Required(ErrorMessage = "Mã khu vực không được để trống")]
            public string AreaCode { get; set; }

            public string Description { get; set; }

            [Required(ErrorMessage = "StorageConditionId không được để trống")]
            [Range(1, int.MaxValue, ErrorMessage = "StorageConditionId phải là số nguyên dương")]
            public int StorageConditionId { get; set; }

            public int? Status { get; set; }
        }

        public class AreaNameDto
        {
            public string AreaName { get; set; }
        }
    }
}