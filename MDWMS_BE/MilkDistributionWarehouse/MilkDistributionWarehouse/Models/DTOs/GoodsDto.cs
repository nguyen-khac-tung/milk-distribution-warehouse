using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class GoodsDto
    {
        [JsonPropertyOrder(1)]
        public int GoodsId { get; set; }

        [JsonPropertyOrder(2)]
        public string GoodsCode { get; set; }

        [JsonPropertyOrder(3)]
        public string GoodsName { get; set; }

        [JsonPropertyOrder(4)]
        public int UnitMeasureId { get; set; }

        [JsonPropertyOrder(5)]
        public string UnitMeasureName { get; set; }

        [JsonPropertyOrder(6)]
        public int CategoryId { get; set; }

        [JsonPropertyOrder(7)]
        public string CategoryName { get; set; }

        [JsonPropertyOrder(8)]
        public int SupplierId { get; set; }

        [JsonPropertyOrder(9)]
        public string CompanyName { get; set; }

        [JsonPropertyOrder(10)]
        public int StorageConditionId { get; set; }

        [JsonPropertyOrder(11)]
        public int Status { get; set; }
    }

    public class GoodsDetail : GoodsDto
    {
        [JsonPropertyOrder(12)]
        public string BrandName { get; set; }
        
        [JsonPropertyOrder(13)]
        public string Address { get; set; }

        [JsonPropertyOrder(14)]
        public decimal? TemperatureMin { get; set; }

        [JsonPropertyOrder(15)]
        public decimal? TemperatureMax { get; set; }

        [JsonPropertyOrder(16)]
        public decimal? HumidityMin { get; set; }

        [JsonPropertyOrder(17)]
        public decimal? HumidityMax { get; set; }

        [JsonPropertyOrder(18)]
        public string? LightLevel { get; set; }
    }

    public class GoodsCreate
    {
        [Required, MaxLength(255)]
        public string GoodsCode { get; set; }
        [Required, MaxLength(255)]
        public string GoodsName { get; set; }
        [Required]
        public int CategoryId { get; set; }
        [Required]
        public int SupplierId { get; set; }
        [Required]
        public int StorageConditionId { get; set; }
        [Required]
        public int UnitMeasureId { get; set; }
    }

    public class GoodsUpdate : GoodsCreate
    {
        [Required]
        public int GoodsId { get; set; }    
        public int Status { get; set; }
    }
}
