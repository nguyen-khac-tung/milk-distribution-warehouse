namespace MilkDistributionWarehouse.Models.DTOs
{
    public class SalesOrderDto
    {
        public Guid SalesOrderId { get; set; }
        public int RetailerId { get; set; }
        public RetailerContactDto RetailerContact { get; set; }
        public DateTime? EstimatedTimeDeparture { get; set; }
        public int? Status { get; set; }
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
        public List<SalesOrderItemDetailDto>? SalesOrderItemDetails { get; set; } = new();
        public UserDto? CreatedBy { get; set; }
        public UserDto? ApprovalBy { get; set; }
        public UserDto? AcknowledgedBy { get; set; }
        public UserDto? AssignTo { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class SalesOrderItemDetailDto
    {
        public int SalesOrderDetailId { get; set; }

        public GoodsDto Goods { get; set; }

        public int? Quantity { get; set; }
    }
}
