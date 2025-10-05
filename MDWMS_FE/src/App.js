import { routes } from "./routes/routes";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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
    </Router>
  );
}

export default App;
