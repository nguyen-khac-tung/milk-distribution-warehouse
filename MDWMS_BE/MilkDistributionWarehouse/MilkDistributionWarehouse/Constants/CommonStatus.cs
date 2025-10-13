namespace MilkDistributionWarehouse.Constants
{
    public class CommonStatus
    {
        public const int Active = 1;          // Hoạt động
        public const int Inactive = 2;        // Không hoạt động
        public const int Deleted = 3;         // Đã xóa
    }

    /// <summary>
    /// Các trạng thái của Đơn đặt hàng (Purchase Order)
    /// </summary>
    public static class PurchaseOrderStatus
    {
        public const int Draft = 1;
        public const int PendingApproval = 2;   
        public const int Rejected = 3;
        public const int Approved = 4;
        public const int GoodsReceived = 5;
        public const int AssignedForReceiving = 6;
        public const int Receiving = 7;
        public const int Inspected = 8;
        public const int Completed = 9;
    }

    /// <summary>
    /// Các trạng thái của Phiếu Nhập Kho (Goods Receipt Note)
    /// </summary>
    public static class GoodsReceiptNoteStatus
    {
        public const int Draft = 1;
        public const int PendingApproval = 2;
        public const int Completed = 3;
    }

    /// <summary>
    /// Các trạng thái của từng dòng sản phẩm trong Phiếu Nhập Kho (Goods Receipt Note Item)
    /// </summary>
    public static class ReceiptItemStatus
    {
        public const int Receiving = 1;
        public const int Inspected = 2;
        public const int PendingApproval = 3;
        public const int Completed = 4;
    }

    /// <summary>
    /// Các trạng thái của Đơn bán hàng (Sales Order)
    /// </summary>
    public static class SalesOrderStatus
    {
        public const int Draft = 1;
        public const int PendingApproval = 2;
        public const int Rejected = 3;
        public const int Approved = 4;
        public const int AssignedForPicking = 5;
        public const int Picking = 6;
        public const int Completed = 7;
    }

    /// <summary>
    /// Các trạng thái của Phiếu Xuất Kho (Goods Issue Note)
    /// </summary>
    public static class GoodsIssueNoteStatus
    {
        public const int Draft = 1;
        public const int PendingApproval = 2;
        public const int Completed = 3;
    }

    /// <summary>
    /// Các trạng thái của từng dòng sản phẩm trong Phiếu Xuất Kho (Goods Issue Note Item)
    /// </summary>
    public static class IssueItemStatus
    {
        public const int Picking = 1;
        public const int Picked = 2;
        public const int PendingApproval = 3;
        public const int Completed = 4;
    }

    /// <summary>
    /// Các trạng thái ánh sáng của kho (StorageCondition)
    /// </summary>
    public static class LightStorageConditionStatus
    {
        public const string Low = "Low";
        public const string Normal = "Normal";
        public const string High = "High";
    }

    /// <summary>
    /// Các trạng thái của phiếu bổ sung (BackOrder)
    /// </summary>
    public static class BackOrderStatus
    {
        public const int Available = 1;
        public const int Unavailable = 2;
    }
}
