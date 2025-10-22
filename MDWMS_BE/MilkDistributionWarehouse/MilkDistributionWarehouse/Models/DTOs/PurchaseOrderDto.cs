using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;

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

    public class PurchaseOrderDtoWarehouseManager : PurchaseOrderDtoSaleManager { }

    public class PurchaseOrdersDetail : PurchaseOrderDtoSaleManager
    {
        [Required(ErrorMessage = "PurchaseOrderId is required")]
        public Guid PurchaseOrderId { get; set; }
        List<PurchaseOrderDetailDto> PurchaseOrderDetails { get; set; } = new();
        public DateTime? UpdatedAt { get; set; }
    }

    public class PurchaseOrderCreate
    {
        public int SupplierId { get; set; }

        List<PurchaseOrderDetailCreate> PurchaseOrderDetail { get; set; } = new();
    }
}
