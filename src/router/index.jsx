import { createBrowserRouter } from "react-router-dom";
import Mockup from "../pages/mockup";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Mockup />,
  },
]);
