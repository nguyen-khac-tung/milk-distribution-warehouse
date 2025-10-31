using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class GoodsReceiptNoteDetailDto
    {
        public class GoodsReceiptNoteDetailPalletDto
        {
            public Guid GoodsReceiptNoteDetailId { get; set; }
            public Guid GoodsReceiptNoteId { get; set; }
            public int GoodsId { get; set; }
            public string GoodsName { get; set; }
            public int GoodsPackingId { get; set; }
            public int UnitPerPackage { get; set; }
            public string UnitMeasureName { get; set; }
        }
    }

    public class GoodsReceiptNoteDetailListDto
    {
        public Guid GoodsReceiptNoteDetailId { get; set; }
        public int GoodsId { get; set; }
        public string GoodsCode { get; set; }
        public string GoodsName { get; set; }
        public string UnitMeasureName { get; set; }
        public int GoodsPackingId { get; set; }
        public int UnitPerPackage { get; set; }
        public int ExpectedPackageQuantity { get; set; }
        public int? DeliveredPackageQuantity { get; set; }
        public int? RejectPackageQuantity { get; set; }
        public int? ActualPackageQuantity { get; set; }
        public string RejectionReason { get; set; }
        public int Status { get; set; }
        public string? Note { get; set; }
    }

    public class GoodsReceiptNoteDetailUpdateStatus
    {
        public Guid GoodsReceiptNoteDetailId { get; set; }
    }

    public class GoodsReceiptNoteDetailInspectedDto : GoodsReceiptNoteDetailUpdateStatus
    {
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn hoặc bằng 0.")]
        public int? DeliveredPackageQuantity { get; set; }
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn hoặc bằng 0.")]
        public int? RejectPackageQuantity { get; set; }
        [MaxLength(255, ErrorMessage = "Độ dài không được vượt quá 255 ký tự.")]
        public string? Note { get; set; }
    }

    public class GoodsReceiptNoteDetailPendingApprovalDto : GoodsReceiptNoteDetailUpdateStatus {}

    public class GoodsReceiptNoteDetailCancelDto : GoodsReceiptNoteDetailUpdateStatus { }

    public class GoodsReceiptNoteDetailRejectDto : GoodsReceiptNoteDetailUpdateStatus
    {
        public string? RejectionReason { get; set; }
    }

    public class GoodsReceiptNoteDetailCompletedDto : GoodsReceiptNoteDetailUpdateStatus { }
}
