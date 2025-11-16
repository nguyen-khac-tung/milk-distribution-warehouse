using MilkDistributionWarehouse.Utilities;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class SalesOrderDto
    {
        public string SalesOrderId { get; set; }
        public int RetailerId { get; set; }
        public string RetailerName { get; set; }
        public DateOnly? EstimatedTimeDeparture { get; set; }
        public int Status { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class SalesOrderDtoSalesRepresentative : SalesOrderDto
    {
        public int CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public int ApprovalBy { get; set; }
        public string? ApprovalByName { get; set; }
    }

    public class SalesOrderDtoSaleManager : SalesOrderDtoSalesRepresentative
    {
        public int AcknowledgedBy { get; set; }
        public string? AcknowledgedByName { get; set; }
    }

    public class SalesOrderDtoWarehouseManager : SalesOrderDtoSaleManager
    {
        public int AssignTo { get; set; }
        public string? AssignToName { get; set; }
    }

    public class SalesOrderDtoWarehouseStaff : SalesOrderDto
    {
        public int AcknowledgedBy { get; set; }
        public string? AcknowledgedByName { get; set; }
        public int AssignTo { get; set; }
        public string? AssignToName { get; set; }
    }

    public class SalesOrderDetailDto : SalesOrderDto
    {
        public string RetailerPhone { get; set; }
        public string RetailerEmail { get; set; }
        public string RetailerAddress { get; set; }
        public List<SalesOrderItemDetailDto>? SalesOrderItemDetails { get; set; } = new();
        public UserDto? CreatedBy { get; set; }
        public UserDto? ApprovalBy { get; set; }
        public UserDto? AcknowledgedBy { get; set; }
        public UserDto? AssignTo { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ApprovalAt { get; set; }
        public DateTime? AcknowledgeAt { get; set; }
        public DateTime? PickingAt { get; set; }
        public string Note { get; set; }
        public string RejectionReason { get; set; }
    }

    public class SalesOrderItemDetailDto
    {
        public int SalesOrderDetailId { get; set; }
        public GoodsDto Goods { get; set; }
        public GoodsPackingDto GoodsPacking { get; set; }
        public int? PackageQuantity { get; set; }
    }

    public class SalesOrderCreateDto
    {
        [Required(ErrorMessage = "Nhà bán lẻ không được bỏ trống.")]
        public int? RetailerId { get; set; }

        [JsonConverter(typeof(NullableDateOnlyConverter))]
        [Required(ErrorMessage = "Ngày dự kiến giao không được bỏ trống.")]
        [DataType(DataType.Date, ErrorMessage = "Định dạng ngày không hợp lệ.")]
        public DateOnly? EstimatedTimeDeparture { get; set; }

        [Required(ErrorMessage = "Danh sách hàng hóa không được bỏ trống.")]
        public List<SalesOrderItemDetailCreateDto>? SalesOrderItemDetailCreateDtos { get; set; }

        public string? Note { get; set; }
    }

    public class SalesOrderItemDetailCreateDto
    {
        [Required(ErrorMessage = "Nhà cung cấp hàng hóa không được bỏ trống.")]
        public int? SupplierId { get; set; }

        [Required(ErrorMessage = "Hàng hoá không được bỏ trống.")]
        public int? GoodsId { get; set; }

        [Required(ErrorMessage = "Số lượng một thùng không được bỏ trống.")]
        public int? GoodsPackingId { get; set; }

        [Required(ErrorMessage = "Số lượng không được bỏ trống.")]
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0.")]
        public int? PackageQuantity { get; set; }
    }

    public class SalesOrderUpdateDto
    {
        public string SalesOrderId { get; set; }

        [Required(ErrorMessage = "Nhà bán lẻ không được bỏ trống.")]
        public int? RetailerId { get; set; }

        [JsonConverter(typeof(NullableDateOnlyConverter))]
        [Required(ErrorMessage = "Ngày dự kiến giao không được bỏ trống.")]
        [DataType(DataType.Date, ErrorMessage = "Định dạng ngày không hợp lệ.")]
        public DateOnly? EstimatedTimeDeparture { get; set; }

        [Required(ErrorMessage = "Danh sách hàng hóa không được bỏ trống.")]
        public List<SalesOrderItemDetailUpdateDto>? SalesOrderItemDetailUpdateDtos { get; set; }

        public string? Note { get; set; }
    }

    public class SalesOrderItemDetailUpdateDto : SalesOrderItemDetailCreateDto
    {
        public int? SalesOrderDetailId { get; set; }
    }

    public class SaleSOrderUpdateStatusDto
    {
        public string SalesOrderId { get; set; }
    }

    public class SalesOrderPendingApprovalDto: SaleSOrderUpdateStatusDto
    {
    }

    public class SalesOrderApprovalDto : SaleSOrderUpdateStatusDto
    {
    }

    public class SalesOrderRejectDto : SaleSOrderUpdateStatusDto
    {
        [Required(ErrorMessage = "Lý do từ chối không được bỏ trống.")]
        public string? RejectionReason { get; set; }
    }

    public class SalesOrderAssignedForPickingDto : SaleSOrderUpdateStatusDto
    {
        [Required(ErrorMessage = "Nhân viên kho không được bỏ trống.")]
        public int? AssignTo { get; set; }
    }

}
