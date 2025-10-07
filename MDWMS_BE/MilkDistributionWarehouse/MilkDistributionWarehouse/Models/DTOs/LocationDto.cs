namespace MilkDistributionWarehouse.Models.DTOs
{
    public class LocationDto
    {
        public class LocationResponseDto
        {
            public int LocationId { get; set; }

            public int? AreaId { get; set; }

            public string LocationCode { get; set; }

            public string Rack { get; set; }

            public int? Row { get; set; }

            public int? Column { get; set; }

            public bool? IsAvailable { get; set; }

            public int? Status { get; set; }

            public DateTime? CreatedAt { get; set; }

            public DateTime? UpdateAt { get; set; }
        }

        public class LocationRequestDto
        {
            public int AreaId { get; set; }

            public string LocationCode { get; set; }

            public string Rack { get; set; }

            public int? Row { get; set; }

            public int? Column { get; set; }

            public bool? IsAvailable { get; set; }
        }
    }
}