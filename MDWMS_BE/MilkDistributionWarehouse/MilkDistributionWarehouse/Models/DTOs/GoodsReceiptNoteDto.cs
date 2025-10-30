using System;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class GoodsReceiptNoteDto
    {
        public Guid GoodsReceiptNoteId { get; set; }
        public int? Status { get; set; }
        public int? ApprovalBy { get; set; }
        public string ApprovalByName { get; set; }
        public int? CreatedBy { get; set; }
        public string CreatedByName { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid PurchaseOderId { get; set; }
        public List<GoodsReceiptNoteDetailListDto> GoodsReceiptNoteDetails { get; set; }
    }
    public class GoodsReceiptNoteCreate
    {
        public Guid PurchaseOderId { get; set; }
    }

    public class GoodsReceiptNoteUpdateStatus
    {
        public Guid GoodsReceiptNoteId { get; set; }
    }

    public class GoodsReceiptNoteSubmitDto : GoodsReceiptNoteUpdateStatus
    {
    }
}
