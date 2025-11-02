using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class GoodsIssueNoteCreateDto
    {
        public Guid? SalesOrderId { get; set; }
    }

    public class GoodsIssueNoteDetailDto
    {
        public Guid GoodsIssueNoteId { get; set; }
        public Guid SalesOderId { get; set; }
        public int Status { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? CreatedByName { get; set; }
        public string? ApprovalByName { get; set; }
        public List<GoodsIssueNoteItemDetailDto> GoodsIssueNoteDetails { get; set; } = new();
    }

    public class GoodsIssueNoteItemDetailDto
    {
        public Guid GoodsIssueNoteDetailId { get; set; }
        public string? GoodsName { get; set; }
        public string? GoodsCode { get; set; }
        public int? UnitPerPackage { get; set; }
        public int? RequiredPackageQuantity { get; set; }
        public int Status { get; set; }
        public string? Note { get; set; }
        public string? RejectionReason { get; set; }
        public List<PickAllocationDto> PickAllocations { get; set; } = new();
    }

    public class RePickGoodsIssueNoteDetailDto
    {
        [Required(ErrorMessage = "Mã chi tiết phiếu xuất kho không được để trống.")]
        public Guid? GoodsIssueNoteDetailId { get; set; }

        public string? RejectionReason { get; set; }
    }

    public class SubmitGoodsIssueNoteDto
    {
        public Guid? GoodsIssueNoteId { get; set; }
    }

    public class ApproveGoodsIssueNoteDto
    {
        public Guid GoodsIssueNoteId { get; set; }
    }
}
