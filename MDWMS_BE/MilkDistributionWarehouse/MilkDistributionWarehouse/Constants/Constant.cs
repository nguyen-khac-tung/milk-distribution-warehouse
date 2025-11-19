namespace MilkDistributionWarehouse.Constants
{
    public class CommonStatus
    {
        public const int Active = 1;          // Hoạt động
        public const int Inactive = 2;        // Không hoạt động
        public const int Deleted = 3;         // Đã xóa
    }

    public class RoleType
    {
        public const int WarehouseManager = 1;
        public const int WarehouseStaff = 2;
        public const int Administrator = 3;
        public const int BusinessOwner = 4;
        public const int SalesRepresentative = 5;
        public const int SaleManager = 6;
    }

    public static class RoleNames
    {
        public const string SalesRepresentative = "Sales Representative";
        public const string SalesManager = "Sale Manager";
        public const string WarehouseManager = "Warehouse Manager";
        public const string WarehouseStaff = "Warehouse Staff";
        public const string Administrator = "Administrator";
        public const string BusinessOwner = "Business Owner";
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
        public const int Ordered = 10;
        public const int AwaitingArrival = 11;
    }

    /// <summary>
    /// Các trạng thái của Phiếu Nhập Kho (Goods Receipt Note)
    /// </summary>
    public static class GoodsReceiptNoteStatus
    {
        public const int Receiving = 1;
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
        public const int Picking = 1;
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
    /// Các trạng thái của Đơn Yêu Cầu Xuất Hủy (Disposal Request)
    /// </summary>
    public static class DisposalRequestStatus
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
    /// Các trạng thái của Phiếu Xuất Hủy (Disposal Note)
    /// </summary>
    public static class DisposalNoteStatus
    {
        public const int Picking = 1;
        public const int PendingApproval = 2;
        public const int Completed = 3;
    }

    /// <summary>
    /// Các trạng thái của từng dòng sản phẩm trong Phiếu Xuất Hủy (Disposal Note)
    /// </summary>
    public static class DisposalNoteItemStatus
    {
        public const int Picking = 1;
        public const int Picked = 2;
        public const int PendingApproval = 3;
        public const int Completed = 4;
    }

    /// <summary>
    /// Các trạng thái của PickAllocation
    /// </summary>
    public static class PickAllocationStatus
    {
        public const int UnScanned = 1;
        public const int Scanned = 2;
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
        public const string Available = "Available";
        public const string Unavailable = "Unavailable";
    }

    /// <summary>
    /// Các trạng thái của phiểu kiểm kê
    /// </summary>
    public static class StocktakingStatus
    {
        public const int Draft = 1;             //Nháp
        public const int Assigned = 2;          //Đã phân công
        public const int Cancelled = 3;         //Đã huỷ
        public const int InProgress = 4;        //Đang kiểm kê
        public const int PendingApproval = 5;   //Chờ duyệt
        public const int Approved = 6;          //Đã duyệt
        public const int Completed = 7;         //Đã hoàn thành
    }

    /// <summary>
    /// Trạng thái của những khu vực (trong phiếu kiểm kê tổng)
    /// </summary>
    public static class StockAreaStatus
    {
        public const int Assigned = 1;            //Đã Phân Công 
        public const int Pending = 2;             //Đang kiểm kê
        public const int PendingApproval = 3;     //Chờ duyệt
        public const int Completed = 4;           //Đã hoàn thành
    }

    /// <summary>
    /// Trạng thái của những vị trí (trong phiếu kiểm kê tổng)
    /// </summary>
    public static class StockLocationStatus
    {
        public const int Pending = 1;             //Đang chờ
        public const int Counted = 2;             //Đã kiểm
        public const int PendingApproval = 3;     //Chờ duyệt
        public const int Completed = 4;           //Đã hoàn thành
    }

    /// <summary>
    /// Trạng thái của pallet trong một vị trí
    /// </summary>
    public static class StockPalletStatus
    {
        public const int Unscanned = 1;     //Chưa quét
        public const int Matched = 2;       //Đúng pallet
        public const int Missing = 3;       //Thiếu pallet
        public const int Surplus = 4;       //Thừa pallet
    }

    /// <summary>
    /// Các trạng thái của thông báo (NotificationStatus)
    /// </summary>
    public static class NotificationStatus
    {
        public const int Read = 1;
        public const int Unread = 2;
        public const int Deleted = 3;
    }

    /// <summary>
    /// Các phân loại thông báo (NotificationCategory)
    /// </summary>
    public static class NotificationCategory
    {
        public const int Normal = 1;
        public const int Important = 2;
    }

    public static class StocktakingSettings
    {
        public const int HoursBeforeStartToAllowEdit = 6;
    }

    /// <summary>
    /// Các trạng thái của InventoryLedger (TypeChange)
    /// </summary>
    public static class InventoryLegerTypeChange
    {
        public const int Receipt = 1;
        public const int Issue = 2;
        public const int Disposal = 3;
    }
}