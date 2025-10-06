namespace MilkDistributionWarehouse.Models.DTOs
{
    public class UnitMeasureDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int Status { get; set; }
    }
    public class Filter
    {
        public string? Search { get; set; }
        public int? Status { get; set; }
    }
}
