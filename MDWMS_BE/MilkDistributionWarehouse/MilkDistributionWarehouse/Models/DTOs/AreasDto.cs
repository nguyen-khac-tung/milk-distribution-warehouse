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
            public string AreaName { get; set; }

            public string AreaCode { get; set; }

            public string Description { get; set; }

            public int StorageConditionId { get; set; }
        }

        public class AreaNameDto
        {
            public string AreaName { get; set; }
        }
    }
}