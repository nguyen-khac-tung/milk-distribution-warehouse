using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class DisposalRequestDto
    {
        public string DisposalRequestId { get; set; }
        public DateOnly? EstimatedTimeDeparture { get; set; }
        public int? Status { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class DisposalRequestDtoSaleManager : DisposalRequestDto
    {
        public int? CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public int? ApprovalBy { get; set; }
        public string? ApprovalByName { get; set; }
    }

    public class DisposalRequestDtoWarehouseManager : DisposalRequestDtoSaleManager
    {
        public int? AssignTo { get; set; }
        public string? AssignToName { get; set; }
    }

    public class DisposalRequestDtoWarehouseStaff : DisposalRequestDto
    {
        public int? CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public int? AssignTo { get; set; }
        public string? AssignToName { get; set; }
    }

    public class DisposalRequestDetailDto : DisposalRequestDto
    {
        public List<DisposalRequestItemDetailDto>? DisposalRequestDetails { get; set; } = new();
        public UserDto? CreatedBy { get; set; }
        public UserDto? ApprovalBy { get; set; }
        public UserDto? AssignTo { get; set; }
        public DateTime? UpdateAt { get; set; }
        public DateTime? ApprovalAt { get; set; }
        public DateTime? AssignAt { get; set; }
        public string? Note { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class DisposalRequestItemDetailDto
    {
        public int DisposalRequestDetailId { get; set; }
        public GoodsDto Goods { get; set; }
        public GoodsPackingDto GoodsPacking { get; set; }
        public int? PackageQuantity { get; set; }
    }

    public class DisposalRequestCreateDto
    {
        [Required(ErrorMessage = "Ngày dự kiến xuất hủy không được bỏ trống.")]
        public DateOnly? EstimatedTimeDeparture { get; set; }

        [Required(ErrorMessage = "Danh sách hàng hóa không được bỏ trống.")]
        public List<DisposalRequestItemCreateDto> DisposalRequestItems { get; set; }

        public string? Note { get; set; }
    }

    public class DisposalRequestItemCreateDto
    {
        [Required(ErrorMessage = "Hàng hoá không được bỏ trống.")]
        public int? GoodsId { get; set; }

        [Required(ErrorMessage = "Loại đóng gói không được bỏ trống.")]
        public int? GoodsPackingId { get; set; }

        [Required(ErrorMessage = "Số lượng không được bỏ trống.")]
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0.")]
        public int? PackageQuantity { get; set; }
    }

    public class ExpiredGoodsDisposalDto
    {
        public GoodsDto Goods { get; set; }
        public GoodsPackingDto GoodsPacking { get; set; }
        public int TotalExpiredPackageQuantity { get; set; }
    }
}
