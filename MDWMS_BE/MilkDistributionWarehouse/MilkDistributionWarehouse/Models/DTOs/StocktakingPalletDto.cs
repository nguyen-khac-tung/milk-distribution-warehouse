namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StocktakingPalletDto
    {
    }

    public class StocktakingPalletCreate
    {
        public Guid StocktakingLocationid { get; set; } 
        public int LocationId { get; set; }
    }
}
