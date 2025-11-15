namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StocktakingPalletDto
    {
        public Guid StocktakingPalletId { get; set; }
        public string PalletId { get; set; }
        public int? ExpectedPackageQuantity { get; set; }
        public int? ActualPackageQuantity { get; set; }
        public int? Status { get; set; }
        public string Note { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class StocktakingPalletCreate
    {
        public Guid StocktakingLocationid { get; set; } 
        public int LocationId { get; set; }
    }
}
