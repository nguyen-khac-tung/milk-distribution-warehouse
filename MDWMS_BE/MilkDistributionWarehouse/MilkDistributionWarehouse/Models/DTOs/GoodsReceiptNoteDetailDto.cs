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
}
