
import NotFoundPage from "../pages/NotFoundPage";
import Dashboard from "../pages/AccountPage/Dashboard/Dashboard";
import Products from "../pages/GoodPage/GoodsList";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
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
import { PERMISSIONS } from "../utils/permissions";
import ChangePassword from "../pages/AccountPage/ChangePasswordPage";

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
        path: "/change-password",
        page: ChangePassword
    },
    {
        path: "/unauthorized",
        page: UnauthorizedPage,
    },
    {
        path: "/",
        page: () => {
            if (localStorage.getItem("accessToken")) {
                return <RoleBasedRedirect />;
            } else {
                window.location.href = "/login";
                return null;
            }
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
        path: "/batches",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.BATCH_VIEW}>
                <BatchList />
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
    {
        path: "/settings",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.SETTINGS_VIEW}>
                <Settings />
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/purchase-orders",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.PURCHASE_ORDER_VIEW_RS}>
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
    { path: "*", page: NotFoundPage },
];