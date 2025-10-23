import { routes } from "./routes/routes";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ToastManager from "./components/Common/ToastManager";
import Layout from "./components/layout/Layout";

function App() {
  return (
    <Router>
      <Routes>
        {routes.map((route) => {
          const Page = route.page;
          // Các trang authentication không sử dụng Layout
          const isAuthPage = ['/login', '/forgot-password', '/verify-otp', '/reset-password', '/unauthorized'].includes(route.path);
          
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                isAuthPage ? (
                  <Page />
                ) : (
                  <Layout>
                    <Page />
                  </Layout>
                )
              }
            />
          );
        })}
      </Routes>
      <ToastManager />
    </Router>
  );
}

export default App;
