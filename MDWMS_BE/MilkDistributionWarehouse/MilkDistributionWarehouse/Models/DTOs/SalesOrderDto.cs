namespace MilkDistributionWarehouse.Models.DTOs
{
    public class SalesOrderDto
    {
        public Guid SalesOrderId { get; set; }

        public RetailerDto Retailer { get; set; }

        public DateTime? EstimatedTimeDeparture { get; set; }

        public int? Status { get; set; }

        public DateTime? CreatedAt { get; set; }
    }

    public class SalesOrderDtoSaleRepresentative : SalesOrderDto
    {
        public UserBasicDto CreatedBy { get; set; }
        public UserBasicDto ApprovalBy { get; set; }
    }

    public class SalesOrderDtoSaleManager : SalesOrderDtoSaleRepresentative
    {
        public UserBasicDto AcknowledgedBy { get; set; }
    }
    public class SalesOrderDtoWarehouseManager : SalesOrderDtoSaleManager
    {
        public UserBasicDto AssignTo { get; set; }
    }

    public class SalesOrderDtoWarehouseStaff : SalesOrderDto
    {
        public UserBasicDto AcknowledgedBy { get; set; }
        public UserBasicDto AssignTo { get; set; }
    }

    public class SalesOrdersDetail : SalesOrderDto
    {
        public List<SalesOrderDetailDto>? SalesOrderDetails { get; set; } = new();
        public UserBasicDto CreatedBy { get; set; }
        public UserBasicDto ApprovalBy { get; set; }
        public UserBasicDto AcknowledgedBy { get; set; }
        public UserBasicDto AssignTo { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
