import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
// import Analyze from "./pages/Analyze";
// import Report from "./pages/Report";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  // { path: "/analyze", element: <Analyze /> },
  // { path: "/report", element: <Report /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
