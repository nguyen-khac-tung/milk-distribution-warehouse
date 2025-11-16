using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StocktakingLocationDto
    {
        public Guid StocktakingLocationId { get; set; }
        public Guid? StocktakingAreaId { get; set; }
        public int? LocationId { get; set; }
        public string LocationCode { get; set; }
        public string Note { get; set; }
        public int? Status { get; set; }
        public DateTime? CreatedAt { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class StocktakingLocationCreate
    {
        public Guid StocktakingAreaId { get; set; }
        public int AreaId { get; set; }
    }

    public class StocktakingLocationResponse
    {
        public Guid StocktakingLocationId { get; set; }
    }

    public class StocktakingLocationUpdateStatus
    {
        [Required(ErrorMessage = "Mã kiểm kê vị trí là bắt buộc.")]
        public Guid StocktakingLocationId { get; set; }
    }

    public class StocktakingLocationPendingStatus : StocktakingLocationUpdateStatus { }

    public class StocktakingLocationCountedStatus : StocktakingLocationUpdateStatus { }

    public class StocktakingLocationPendingApprovalStatus : StocktakingLocationUpdateStatus { }


}
