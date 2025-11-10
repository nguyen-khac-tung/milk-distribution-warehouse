using MilkDistributionWarehouse.Models.Entities;
using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StocktakingSheetDto
    {
        public Guid StocktakingSheetId { get; set; }
        public int? Status { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? CreatedBy { get; set; }
        public string CreateByName { get; set; }
    }

    public class StocktakingSheetCreate
    {
        [Required(ErrorMessage = "Thời gian bắt đầu kiểm kê là bắt buộc.")]
        public DateTime StartTime { get; set; }
        public string? Note { get; set; }
        [Required]
        public List<StocktakingAreaCreate> StocktakingAreaCreates { get; set; }
    }

    public class StocktakingSheetCreateResponse
    {
        public Guid StocktakingSheetId { get; set; }
    }

    public class StockingSheetUpdate
    {
        [Required(ErrorMessage = "Mã phiếu kiểm kê là bắt buộc.")]
        public Guid StocktakingSheetId { get; set; }
        [Required(ErrorMessage = "Thời gian bắt đầu kiểm kê là bắt buộc.")]
        public DateTime StartTime { get; set; }
        public string? Note { get; set; }
        public List<StocktakingAreaUpdate> StocktakingAreaUpdates { get; set; }
    }

    public class StocktakingSheetDetail : StocktakingSheetDto
    {

    }
}
