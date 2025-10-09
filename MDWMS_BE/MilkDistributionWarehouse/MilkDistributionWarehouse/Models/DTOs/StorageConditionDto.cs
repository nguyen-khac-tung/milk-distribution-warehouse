using System.ComponentModel.DataAnnotations;

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
        }

        public class StorageConditionCreateDto
        {
            public decimal? TemperatureMin { get; set; }

            public decimal? TemperatureMax { get; set; }

            public decimal? HumidityMin { get; set; }

            public decimal? HumidityMax { get; set; }

            [Required(ErrorMessage = "Mức độ sáng không được để trống!")]
            public string LightLevel { get; set; }

        }

        public class StorageConditionUpdateDto
        {
            public decimal? TemperatureMin { get; set; }

            public decimal? TemperatureMax { get; set; }

            public decimal? HumidityMin { get; set; }

            public decimal? HumidityMax { get; set; }

            [Required(ErrorMessage = "Mức độ sáng không được để trống!")]
            public string LightLevel { get; set; }

            public int? Status { get; set; }
        }
    }
}
