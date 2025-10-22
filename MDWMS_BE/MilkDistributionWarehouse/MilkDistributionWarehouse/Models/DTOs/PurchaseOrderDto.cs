namespace MilkDistributionWarehouse.Models.DTOs
{
    public class PurchaseOrderDtoCommon
    {
        public Guid PurcharseOrderId { get; set; }
        public int Status { get; set; }

        public int SupplierId { get; set; }
        public string? SupplierName { get; set; }

        //public int? AssignTo { get; set; }
        //public string? AssignToName { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class PurchaseOrderDtoSaleRepresentative :PurchaseOrderDtoCommon
    {
        public int? CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public int? ApprovalBy { get; set; }
        public string? ApprovalByName { get; set; }
    }

    public class PurchaseOrderDtoSaleManager: PurchaseOrderDtoSaleRepresentative
    {
        public int? ArrivalConfirmedBy { get; set; }
        public string? ArrivalConfirmedByName { get; set; }
    }

    public class PurchaseOrderCreate
    {

    }
}
