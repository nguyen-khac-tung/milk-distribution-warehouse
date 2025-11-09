using System;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class GoodsReceiptNoteDto
    {
        public string GoodsReceiptNoteId { get; set; }
        public int? Status { get; set; }
        public int? ApprovalBy { get; set; }
        public string ApprovalByName { get; set; }
        public int? CreatedBy { get; set; }
        public string CreatedByName { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string PurchaseOderId { get; set; }
        public List<GoodsReceiptNoteDetailListDto> GoodsReceiptNoteDetails { get; set; }
    }
    public class GoodsReceiptNoteCreate
    {
        public string PurchaseOderId { get; set; }
    }

    public class GoodsReceiptNoteUpdateStatus
    {
        public string GoodsReceiptNoteId { get; set; }
    }

    public class GoodsReceiptNoteSubmitDto : GoodsReceiptNoteUpdateStatus {}

    public class GoodsReceiptNoteCompletedDto : GoodsReceiptNoteUpdateStatus {}

}
