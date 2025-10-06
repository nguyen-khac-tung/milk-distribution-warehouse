using System.ComponentModel.DataAnnotations;

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

    public class UnitMeasureCreate
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        [MaxLength(100)]
        public string Description { get; set; }
    }

    public class UnitMeasureUpdate : UnitMeasureCreate
    {
        [Required]
        public int UnitMeasureId { get; set; }
        public int Status { get; set; }
    }
}
