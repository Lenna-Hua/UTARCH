import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import { apiBase } from "./lib/studio-api";
import "./index.css";

// Production split deploy: VITE_API_URL → absolute API host.
// Local Vite: apiBase() may return "" so /api stays same-origin (proxy).
const resolved = apiBase();
if (resolved) {
  setBaseUrl(resolved);
}

createRoot(document.getElementById("root")!).render(<App />);
