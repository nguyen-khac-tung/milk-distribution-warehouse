using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class LocationDto
    {
        public class LocationResponseDto
        {
            public int LocationId { get; set; }

            public int AreaId { get; set; }

            public AreaDto.AreaNameDto AreaNameDto { get; set; }

            public string LocationCode { get; set; }

            public string Rack { get; set; }

            public int? Row { get; set; }

            public int? Column { get; set; }

            public bool? IsAvailable { get; set; }

            public int? Status { get; set; }

            public DateTime? CreatedAt { get; set; }

            public DateTime? UpdateAt { get; set; }
        }

        public class LocationCreateDto
        {
            [Required(ErrorMessage = "Chưa chọn khu vực!")]
            public int AreaId { get; set; }

            [Required(ErrorMessage = "Mã vị trí không được để trống")]
            public string LocationCode { get; set; }

            [Required(ErrorMessage = "Rack không được để trống")]
            public string Rack { get; set; }

            public int? Row { get; set; }

            public int? Column { get; set; }

            public bool? IsAvailable { get; set; }

        }

        public class LocationUpdateDto
        {
            [Required(ErrorMessage = "Chưa chọn khu vực!")]
            public int AreaId { get; set; }

            [Required(ErrorMessage = "Mã vị trí không được để trống")]
            public string LocationCode { get; set; }

            [Required(ErrorMessage = "Rack không được để trống")]
            public string Rack { get; set; }

            public int? Row { get; set; }

            public int? Column { get; set; }

            public bool? IsAvailable { get; set; }

            public int? Status { get; set; }
        }
    }
}