using Microsoft.AspNetCore.Identity;
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

    public class PurchaseOrderDtoPallet
    {
        public Guid PurchaseOderId { get; set; }
        public int SupplierId { get; set; }
        public string? SupplierName { get; set; }
    }

    public class PurchaseOrderDtoSaleRepresentative : PurchaseOrderDtoCommon
    {
        public int? CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public int? ApprovalBy { get; set; }
        public string? ApprovalByName { get; set; }

        private bool? _isDisableUpdate;
        public bool IsDisableUpdate
        {
            get => _isDisableUpdate ?? (Status != PurchaseOrderStatus.Draft && Status != PurchaseOrderStatus.Rejected);
            set => _isDisableUpdate = value;
        }
        private bool? _isDisableDelete;
        public bool IsDisableDelete
        {
            get => _isDisableDelete ?? (Status != PurchaseOrderStatus.Draft);
            set => _isDisableDelete = value;
        }
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
        public string? Note { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsDisableButton { get; set; }

    }

    public class PurchaseOrderCreate
    {
        [Required(ErrorMessage = "Nhà cung cấp không được bỏ trống.")]
        public int SupplierId { get; set; }
        [MaxLength(255, ErrorMessage = "Độ dài ghi chú không được quá 255 ký tự.")]
        public string? Note { get; set; }
        public List<PurchaseOrderDetailCreate> PurchaseOrderDetailCreate { get; set; } = new();
    }

    public class PurchaseOrderUpdate
    {
        public Guid PurchaseOderId { get; set; }
        public List<PurchaseOrderDetailUpdate> PurchaseOrderDetailUpdates { get; set; } = new();
    }

    public class PurchaseOrderProcess
    {
        [Required]
        public Guid PurchaseOrderId { get; set; }

        [ValidStatusAttributeUtility(typeof(PurchaseOrderStatus))]
        public int Status { get; set; }
        public string? Note { get; set; }
    }

}
