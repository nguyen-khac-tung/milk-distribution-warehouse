using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class DisposalNoteCreateDto
    {
        [Required(ErrorMessage = "Mã yêu cầu xuất hủy không được bỏ trống.")]
        public string? DisposalRequestId { get; set; }
    }

    public class DisposalNoteDetailDto
    {
        public string DisposalNoteId { get; set; }
        public string DisposalRequestId { get; set; }
        public int Status { get; set; }
        public DateOnly? EstimatedTimeDeparture { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? CreatedByName { get; set; }
        public string? ApprovalByName { get; set; }
        public List<DisposalNoteItemDetailDto> DisposalNoteDetails { get; set; } = new();
    }

    public class DisposalNoteItemDetailDto
    {
        public Guid DisposalNoteDetailId { get; set; }
        public string? GoodsName { get; set; }
        public string? GoodsCode { get; set; }
        public int? UnitPerPackage { get; set; }
        public int? RequiredPackageQuantity { get; set; }
        public int Status { get; set; }
        public string? Note { get; set; }
        public string? RejectionReason { get; set; }
        public List<PickAllocationDto> PickAllocations { get; set; } = new();
    }

    public class RePickDisposalNoteDetailDto
    {
        [Required(ErrorMessage = "Mã chi tiết phiếu xuất hủy không được để trống.")]
        public Guid? DisposalNoteDetailId { get; set; }

        public string? RejectionReason { get; set; }
    }

    public class SubmitDisposalNoteDto
    {
        public string? DisposalNoteId { get; set; }
    }

    public class ApproveDisposalNoteDto
    {
        public string? DisposalNoteId { get; set; }
    }
}
