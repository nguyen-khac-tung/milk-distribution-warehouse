using MilkDistributionWarehouse.Models.Entities;
using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StocktakingSheetDto
    {
        public string StocktakingSheetId { get; set; }
        public int? Status { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? CreatedBy { get; set; }
        public string CreateByName { get; set; }
        public bool CanViewStocktakingArea { get; set; }
        public int StockAreaStarted { get; set; }
    }

    public class StocktakingSheetCreate
    {
        [Required(ErrorMessage = "Thời gian bắt đầu kiểm kê là bắt buộc.")]
        public DateTime StartTime { get; set; }
        public string? Note { get; set; }
    }

    public class StocktakingSheeteResponse
    {
        public string StocktakingSheetId { get; set; }
    }

    public class StocktakingSheetUpdate
    {
        [Required(ErrorMessage = "Mã phiếu kiểm kê là bắt buộc.")]
        public string StocktakingSheetId { get; set; }
        [Required(ErrorMessage = "Thời gian bắt đầu kiểm kê là bắt buộc.")]
        public DateTime StartTime { get; set; }
        public string? Note { get; set; }
    }

    public class StocktakingSheetDetail : StocktakingSheetDto
    {
        public string? Note { get; set; }
        public List<StocktakingAreaUpdateDto> StocktakingAreas { get; set; }
    }

    public class StocktakingSheetStatusUpdate
    {
        public string StocktakingSheetId { get; set; }
    }

    public class StocktakingSheetAssignStatus : StocktakingSheetStatusUpdate
    {
        [Required(ErrorMessage = "Danh sách phân công nhân viên theo khu vực là bắt buộc.")]
        public List<StocktakingAreaCreate> StocktakingAreaAssign { get; set; }
    }

    public class StocktakingSheetReAssignStatus : StocktakingSheetStatusUpdate
    {
        [Required(ErrorMessage = "Danh sách phân công nhân viên theo khu vực là bắt buộc.")]
        public List<StocktakingAreaUpdate> StocktakingAreaReAssign { get; set; }
    }

    public class StocktakingSheetCancelStatus : StocktakingSheetStatusUpdate { }
    public class StocktakingSheetInProgressStatus : StocktakingSheetStatusUpdate { }

    public class StocktakingSheetApprovalStatus : StocktakingSheetStatusUpdate { }

    public class StocktakingSheetCompletedStatus : StocktakingSheetStatusUpdate
    {
        public string? Note { get; set; }
    }
}
