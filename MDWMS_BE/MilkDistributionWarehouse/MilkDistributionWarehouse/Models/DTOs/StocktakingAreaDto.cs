using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StocktakingAreaDetail
    {
        public Guid StocktakingAreaId { get; set; }
        public AreaDto.StocktakingAreaDto AreaDetail { get; set; }
        public int AssignTo { get; set; }
        public string AssignToName { get; set; }    
        public int Status { get; set;  }
    }

    public class StocktakingAreaCreateDto
    {
        [Required(ErrorMessage = "AreaId là bắt buộc.")]
        [Range(1, int.MaxValue, ErrorMessage = "AreaId phải lớn hơn 0.")]
        public int AreaId { get; set; }
    }

    public class StocktakingAreaCreate
    {
        [Required(ErrorMessage = "AreaId là bắt buộc.")]
        [Range(1, int.MaxValue, ErrorMessage = "AreaId phải lớn hơn 0.")]
        public int AreaId { get; set; }

        [Required(ErrorMessage = "AssignTo là bắt buộc.")]
        [Range(1, int.MaxValue, ErrorMessage = "AssignTo phải lớn hơn 0.")]
        public int AssignTo { get; set; }
    }

    public class StocktakingAreaUpdate : StocktakingAreaCreate {}

    public class StocktakingAreaDetailDto : StocktakingAreaDetail
    {
        public List<StocktakingLocationDto> StocktakingLocations { get; set; }
    }

    public class StocktakingAreaResponse
    {
        public Guid StocktakingAreaId { get; set; }
    }

    public class StocktakingAreaUpdateDto : AreaDto.StocktakingAreaDto
    {
        public Guid StocktakingAreaId { get; set; }
        public int Status { get; set; }
    }
    public class StocktakingAreaReAssignStatus
    {
        [Required (ErrorMessage = "Mã kiểm kê khu vực là bắt buộc")]
        public Guid StocktakingAreaId { get; set; }
        [Required (ErrorMessage = "Mã nhân viên phân công là bắt buộc")]
        public int AssignTo { get; set; }
    }

    public class StocktakingAreaUpdateStatus
    {
        public Guid StocktakingAreaId { get; set; }
    }

    public class StocktakingAreaPendingStatus : StocktakingAreaUpdateStatus { }

    public class StocktakingAreaPendingAprrovalStatus : StocktakingAreaUpdateStatus { }
    public class StocktakingAreaApprovalStatus : StocktakingAreaUpdateStatus { }

    public class StocktakingAreaApprovalResponse
    {
        public List<StocktakingLocationFail> StocktakingLocationFails { get; set; }
        public List<StocktakingLocationWarming> StocktakingLocationWarmings { get; set; }
    }
}
