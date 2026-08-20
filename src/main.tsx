import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { clearLegacyMockStorage } from "@/lib/migrations/clearLegacyMockStorage";

clearLegacyMockStorage();

createRoot(document.getElementById("root")!).render(<App />);
