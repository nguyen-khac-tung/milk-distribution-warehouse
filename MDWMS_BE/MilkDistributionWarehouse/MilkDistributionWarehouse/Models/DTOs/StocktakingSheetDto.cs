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
    }

    public class StocktakingSheeteResponse
    {
        public Guid StocktakingSheetId { get; set; }
    }

    public class StocktakingSheetUpdate
    {
        [Required(ErrorMessage = "Mã phiếu kiểm kê là bắt buộc.")]
        public Guid StocktakingSheetId { get; set; }
        [Required(ErrorMessage = "Thời gian bắt đầu kiểm kê là bắt buộc.")]
        public DateTime StartTime { get; set; }
        public string? Note { get; set; }
    }

    public class StocktakingSheetDetail : StocktakingSheetDto
    {
        public string? Note { get; set; }
    }

    public class StocktakingSheetStatusUpdate
    {
        public Guid StocktakingSheetId { get; set; }
    }

    public class StocktakingSheetAssignStatus : StocktakingSheetStatusUpdate
    {
        [Required(ErrorMessage = "Danh sách phân công nhân viên theo khu vực là bắt buộc.")]
        public List<StocktakingAreaCreate> StocktakingAreaCreates { get; set; }
    }

    public class StocktakingSheetCancelStatus : StocktakingSheetStatusUpdate { }
}
