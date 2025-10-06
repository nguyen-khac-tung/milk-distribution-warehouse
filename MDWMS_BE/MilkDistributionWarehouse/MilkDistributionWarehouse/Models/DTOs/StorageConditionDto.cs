namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StorageConditionDto
    {

        public class StorageConditionResponseDto
        {
            public int StorageConditionId { get; set; }

            public decimal? TemperatureMin { get; set; }

            public decimal? TemperatureMax { get; set; }

            public decimal? HumidityMin { get; set; }

            public decimal? HumidityMax { get; set; }

            public string LightLevel { get; set; }

            public int? Status { get; set; }

            public DateTime? CreatedAt { get; set; }

            public DateTime? UpdateAt { get; set; }
        }

        public class StorageConditionRequestDto
        {
            public decimal? TemperatureMin { get; set; }

            public decimal? TemperatureMax { get; set; }

            public decimal? HumidityMin { get; set; }

            public decimal? HumidityMax { get; set; }

            public string LightLevel { get; set; }
        }
    }
}
