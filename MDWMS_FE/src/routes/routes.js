
import Layout from "../components/layout/Layout";
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
import { PERMISSIONS } from "../utils/permissions";

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
            <ProtectedRoute requiredPermission={PERMISSIONS.ADMIN_DASHBOARD_VIEW}>
                <Layout>
                    <Dashboard />
                </Layout>
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/accounts",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.ACCOUNT_VIEW}>
                <Layout>
                    <Accounts />
                </Layout>
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/categories",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.CATEGORY_VIEW}>
                <Layout>
                    <CategoryList />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/unit-measures",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.UNIT_MEASURE_VIEW}>
                <Layout>
                    <UnitMeasureList />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/goods",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.GOODS_VIEW}>
                <Layout>
                    <GoodsList />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/batches",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.BATCH_VIEW}>
                <Layout>
                    <BatchList />
                </Layout>
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/suppliers",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.SUPPLIER_VIEW}>
                <Layout>
                    <SupplierList />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/retailers",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.RETAILER_VIEW}>
                <Layout>
                    <RetailerList />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/areas",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.AREA_VIEW}>
                <Layout>
                    <Areas />
                </Layout>
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/locations",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.LOCATION_VIEW}>
                <Layout>
                    <Locations />
                </Layout>
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/storage-conditions",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.STORAGE_CONDITION_VIEW}>
                <Layout>
                    <StorageCondition />
                </Layout>
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/reports",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.REPORT_VIEW}>
                <Layout>
                    <Reports />
                </Layout>
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    {
        path: "/settings",
        page: () => (
            <ProtectedRoute requiredPermission={PERMISSIONS.SETTINGS_VIEW}>
                <Layout>
                    <Settings />
                </Layout>
            </ProtectedRoute>
        ),
        isShowHeader: true,
    },
    { path: "*", page: NotFoundPage },
];