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
        }
    }

    public class GoodsReceiptNoteDetailListDto
    {
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
        public int Status { get; set; }
        public string Note { get; set; }
    }
}
