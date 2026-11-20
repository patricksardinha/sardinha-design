import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/components/components.css";
import "./studio.css";
import { App } from "./App";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
