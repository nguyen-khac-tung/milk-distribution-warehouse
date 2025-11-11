
import NotFoundPage from "../pages/NotFoundPage";
import Dashboard from "../pages/Dashboard/Dashboard";
import CreateSaleOrder from "../pages/SalesOrderPage/CreateSaleOrder";
import Reports from "../pages/Reports";
// import Settings from "../pages/Settings";
import Areas from "../pages/AreaAndLocationPage/AreaPage/AreasList";
import Locations from "../pages/AreaAndLocationPage/LocationPage/LocationList";
import LoginPage from "../pages/AuthenticationPage/LoginPage/LoginPage";
import ForgotPasswordPage from "../pages/AuthenticationPage/ForgotPasswordPage";
import Accounts from "../pages/AccountPage/AccountList"
import CategoryList from "../pages/CategoryPage/CategoryList";
import UnitMeasureList from "../pages/UnitMeasurePage/UnitMeasureList";
import StorageCondition from "../pages/AreaAndLocationPage/StorageCondition/StorageConditionList";
import GoodsList from "../pages/GoodPage/GoodsList";
import SupplierList from "../pages/SupplierAndRetailerPage/SupplierPage/SupplierList";
import RetailerList from "../pages/SupplierAndRetailerPage/RetailerPage/RetailerList";
import BatchList from "../pages/BatchPage/BatchList";
import VerifyOtpPage from "../pages/AuthenticationPage/VerifyOtpPage";
import ResetPasswordPage from "../pages/AuthenticationPage/ResetPasswordPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ProtectedRoute from "../components/Common/ProtectedRoute";
import RoleBasedRedirect from "../components/Common/RoleBasedRedirect";
import PurchaseOrderList from "../pages/PurchaseOrderPage/PurchaseOrderList";
import CreatePurchaseOrder from "../pages/PurchaseOrderPage/CreatePurchaseOrder";
import UpdatePurchaseOrder from "../pages/PurchaseOrderPage/UpdatePurchaseOrder";
import PurchaseOrderDetail from "../pages/PurchaseOrderPage/PurchaseOrderDetail";
import PalletList from "../pages/PalletPage/PalletList";
import ChangePasswordPage from "../pages/AuthenticationPage/ChangePasswordPage"
import { PERMISSIONS } from "../utils/permissions";
import SalesOrderList from "../pages/SalesOrderPage/SalesOrderList";
import SalesOrderDetail from "../pages/SalesOrderPage/SalesOrderDetail";
import GoodsReceiptDetail from "../pages/GoodsReceiptPage/GoodsReceiptDetail";
import BackOrderList from "../pages/BackOrderPage/BackOrderList";
import UpdateSaleOrder from "../pages/SalesOrderPage/UpdateSaleOrder";
import GoodsIssueNoteDetail from "../pages/GoodsIssueNotePage/GoodsIssueNoteDetail";
import StocktakingList from "../pages/StocktakingPage/StocktakingList";
import CreateStocktaking from "../pages/StocktakingPage/CreateStocktaking";
import UpdateStocktaking from "../pages/StocktakingPage/UpdateStocktaking";
import StocktakingDetail from "../pages/StocktakingPage/StocktakingDetail";

export const routes = [
    {
        path: "/login",
        page: LoginPage,
    },
    {
        path: "/forgot-password",
        page: ForgotPasswordPage,
    },
    {
        path: "/verify-otp",
        page: VerifyOtpPage,
    },
    {
        path: "/reset-password",
        page: ResetPasswordPage,
    },
    {
        path: "/unauthorized",
        page: UnauthorizedPage,
    },
    {
        path: "/change-password",
        page: ChangePasswordPage,
    },
    {
        path: "/",
        page: () => {
            return <RoleBasedRedirect />;
        },
    },
    {
        path: "/dashboard",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.DASHBOARD_VIEW}>
                <Dashboard />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/accounts",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.ACCOUNT_VIEW}>
                <Accounts />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/categories",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.CATEGORY_VIEW}>
                <CategoryList />
            </ProtectedRoute>
        ),
    },
    {
        path: "/unit-measures",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.UNIT_MEASURE_VIEW}>
                <UnitMeasureList />
            </ProtectedRoute>
        ),
    },
    {
        path: "/goods",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.GOODS_VIEW}>
                <GoodsList />
            </ProtectedRoute>
        ),
    },
    {
        path: "/backorder",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.BACKORDER_VIEW}>
                <BackOrderList />
            </ProtectedRoute>
        ),
    },
    {
        path: "/batches",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.BATCH_VIEW}>
                <BatchList />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/pallets",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.PALLET_VIEW}>
                <PalletList />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/suppliers",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.SUPPLIER_VIEW}>
                <SupplierList />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/retailers",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.RETAILER_VIEW}>
                <RetailerList />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/areas",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.AREA_VIEW}>
                <Areas />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/locations",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.LOCATION_VIEW}>
                <Locations />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/storage-conditions",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.STORAGE_CONDITION_VIEW}>
                <StorageCondition />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/reports",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.REPORT_VIEW}>
                <Reports />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    // {
    //     path: "/settings",
    //     page: () => (
    //         <ProtectedRoute requiredPermission={PERMISSIONS.SETTINGS_VIEW}>
    //             <Settings />
    //         </ProtectedRoute>
    //     ),
    //     isShowHeader: true,
    // },
    {
        path: "/purchase-orders",
        page: () => (
            <ProtectedRoute requiredPermission={[PERMISSIONS.PURCHASE_ORDER_VIEW]} requireAll={false}>
                <PurchaseOrderList />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/purchase-orders/create",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.PURCHASE_ORDER_CREATE}>
                <CreatePurchaseOrder />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/purchase-orders/update/:id",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.PURCHASE_ORDER_UPDATE}>
                <UpdatePurchaseOrder />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/purchase-orders/:id",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.PURCHASE_ORDER_VIEW_DETAILS}>
                <PurchaseOrderDetail />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    // Phiếu nhập kho
    {
        path: "/goods-receipt-notes/:id",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.GOODS_RECEIPT_NOTE_VIEW_DETAILS}>
                <GoodsReceiptDetail />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    // đơn xuất
    {
        path: "/sales-orders",
        page: () => (
            <ProtectedRoute requiredPermission={[PERMISSIONS.SALES_ORDER_VIEW]} requireAll={false}>
                <SalesOrderList />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/sales-orders/:id",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.SALES_ORDER_VIEW_DETAILS}>
                <SalesOrderDetail />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/sales-orders/create",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.SALES_ORDER_CREATE}>
                <CreateSaleOrder />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/sales-orders/update/:id",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.SALES_ORDER_UPDATE}>
                <UpdateSaleOrder />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/goods-issue-note-detail/:id",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.SALES_ORDER_VIEW_DELIVERY_SLIP}>
                <GoodsIssueNoteDetail />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/stocktakings",
        page: () => (
            <ProtectedRoute requiredPermission={[PERMISSIONS.STOCKTAKING_VIEW, PERMISSIONS.STOCKTAKING_VIEW_WM, PERMISSIONS.STOCKTAKING_VIEW_WS, PERMISSIONS.STOCKTAKING_VIEW_SM]} requireAll={false}>
                <StocktakingList />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/stocktakings/:id",
        page: () => (
            <ProtectedRoute requiredPermission={[PERMISSIONS.STOCKTAKING_VIEW, PERMISSIONS.STOCKTAKING_VIEW_WM, PERMISSIONS.STOCKTAKING_VIEW_WS, PERMISSIONS.STOCKTAKING_VIEW_SM]} requireAll={false}>
                <StocktakingDetail />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/stocktaking/create",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.STOCKTAKING_CREATE}>
                <CreateStocktaking />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/stocktakings/update/:id",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.STOCKTAKING_UPDATE}>
                <UpdateStocktaking />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    { path: "*", page: NotFoundPage },
];