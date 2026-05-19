import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AppProvider } from "./context/AppContext";
import ToastProvider from "./components/ui/toast";

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AppProvider>
  );
}
