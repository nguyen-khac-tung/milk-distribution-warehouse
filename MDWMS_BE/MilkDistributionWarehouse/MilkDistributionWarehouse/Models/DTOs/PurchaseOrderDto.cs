using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Utilities;
using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class PurchaseOrderDtoCommon
    {
        public Guid PurchaseOderId { get; set; }
        public int Status { get; set; }
        public int SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class PurchaseOrderDtoSaleRepresentative : PurchaseOrderDtoCommon
    {
        public int? CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public int? ApprovalBy { get; set; }
        public string? ApprovalByName { get; set; }
        public bool IsDisable => (Status != PurchaseOrderStatus.Draft && Status != PurchaseOrderStatus.Rejected);
    }

    public class PurchaseOrderDtoSaleManager : PurchaseOrderDtoSaleRepresentative
    {
        public int? ArrivalConfirmedBy { get; set; }
        public string? ArrivalConfirmedByName { get; set; }
    }
    public class PurchaseOrderDtoWarehouseStaff : PurchaseOrderDtoCommon
    {
        public int? ArrivalConfirmedBy { get; set; }
        public string? ArrivalConfirmedByName { get; set; }
        public int? AssignTo { get; set; }
        public string? AssignToByName { get; set; }

    }

    public class PurchaseOrderDtoWarehouseManager : PurchaseOrderDtoSaleManager
    {
        public int? AssignTo { get; set; }
        public string? AssignToByName { get; set; }
    }

    public class PurchaseOrdersDetail : PurchaseOrderDtoWarehouseManager
    {
        public List<PurchaseOrderDetailDto>? PurchaseOrderDetails { get; set; } = new();
        public DateTime? UpdatedAt { get; set; }

    }

    public class PurchaseOrderCreate
    {
        [Required(ErrorMessage ="Nhà cung cấp không được bỏ trống.")]
        public int SupplierId { get; set; }
        public List<PurchaseOrderDetailCreate> PurchaseOrderDetailCreate { get; set; } = new();
    }

    public class PurchaseOrderUpdate
    {
        public Guid PurchaseOderId { get; set; }
        public List<PurchaseOrderDetailUpdate> PurchaseOrderDetailUpdates { get; set; } = new();
    }
}
