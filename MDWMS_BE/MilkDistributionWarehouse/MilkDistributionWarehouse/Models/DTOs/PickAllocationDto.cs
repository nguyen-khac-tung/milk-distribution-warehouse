namespace MilkDistributionWarehouse.Models.DTOs
{
    public class PickAllocationDto
    {
        public int PickAllocationId { get; set; }
        public int PickPackageQuantity { get; set; }
        public string? LocationCode { get; set; }
        public string Rack { get; set; }
        public int? Row { get; set; }
        public int? Column { get; set; }
        public string? AreaName { get; set; }
        public string? AreaCode { get; set; }
        public int Status { get; set; }
    }

    public class PickAllocationDetailDto : PickAllocationDto
    {
        
    }
}
