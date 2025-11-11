namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StocktakingLocationDto
    {
    }

    public class StocktakingLocationCreate
    {
        public Guid StocktakingAreaId { get; set; }
        public int AreaId { get; set; }
    }

}
