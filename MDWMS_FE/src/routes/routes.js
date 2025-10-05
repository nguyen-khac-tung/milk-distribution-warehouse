
import AdminLayout from "../components/layout/AdminLayout";
import NotFoundPage from "../pages/NotFoundPage";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import Orders from "../pages/Orders";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import LoginPage from "../pages/AuthenticationPage/LoginPage/LoginPage";

export const routes = [
    {
        path: "/login",
        page: LoginPage,
    },
    {
        path: "/",
        page: () => {
            // Nếu đã đăng nhập thì vào dashboard, chưa thì về login
            if (localStorage.getItem("token")) {
                window.location.href = "/admin/dashboard";
                return null;
            } else {
                window.location.href = "/login";
                return null;
            }
        },
    },
    {
        path: "/admin/dashboard",
        page: () => (
            <AdminLayout>
                <Dashboard />
            </AdminLayout>
        ),
        isShowHeader: true,
    },
    {
        path: "/admin/products",
        page: () => (
            <AdminLayout>
                <Products />
            </AdminLayout>
        ),
        isShowHeader: true,
    },
    {
        path: "/admin/orders",
        page: () => (
            <AdminLayout>
                <Orders />
            </AdminLayout>
        ),
        isShowHeader: true,
    },
    {
        path: "/admin/reports",
        page: () => (
            <AdminLayout>
                <Reports />
            </AdminLayout>
        ),
        isShowHeader: true,
    },
    {
        path: "/admin/settings",
        page: () => (
            <AdminLayout>
                <Settings />
            </AdminLayout>
        ),
        isShowHeader: true,
    },
    { path: "*", page: NotFoundPage },
];