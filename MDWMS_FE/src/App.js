import { routes } from "./routes/routes";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ToastManager from "./components/Common/ToastManager";

function App() {
  return (
    <Router>
      <Routes>
        {routes.map((route) => {
          const Page = route.page;
          return (
            <Route
              key={route.path}
              path={route.path}
              element={<Page />}
            />
          );
        })}
      </Routes>
      <ToastManager />
    </Router>
  );
}

export default App;
