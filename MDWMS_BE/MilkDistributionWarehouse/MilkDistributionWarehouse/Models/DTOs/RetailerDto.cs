using System.Text.Json.Serialization;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class RetailerDto
    {
        [JsonPropertyOrder(0)]
        public int RetailerId { get; set; }
        [JsonPropertyOrder(1)]
        public string RetailerName { get; set; }
        [JsonPropertyOrder(2)]
        public int Status { get; set; }
    }

    public class RetailerDetail : RetailerDto
    {
        [JsonPropertyOrder(3)]
        public string Email { get; set; }
        [JsonPropertyOrder(4)]
        public string Phone { get; set; }
        [JsonPropertyOrder(5)]
        public string TaxCode { get; set; }
        [JsonPropertyOrder(6)]
        public string Address { get; set; }
    }
}
