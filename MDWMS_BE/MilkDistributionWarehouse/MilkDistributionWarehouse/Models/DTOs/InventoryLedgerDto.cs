namespace MilkDistributionWarehouse.Models.DTOs
{
    public class InventoryLedgerRequestDto
    {
        public int GoodsId { get; set; }
        public int GoodPackingId { get; set; }
        public DateTime? EventDate { get; set; }
        public int? InQty { get; set; }
        public int? OutQty { get; set; }
        public int? BalanceAfter { get; set; }
        public int? TypeChange { get; set; }
    }

    public class InventoryLedgerResponseDto
    {
        public int LedgerId { get; set; }
        public int GoodsId { get; set; }
        public int GoodPackingId { get; set; }
        public DateTime? EventDate { get; set; }
        public int? InQty { get; set; }
        public int? OutQty { get; set; }
        public int? BalanceAfter { get; set; }
        public int? TypeChange { get; set; }
    }
}
