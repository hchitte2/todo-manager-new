import React from "react";
import ReactDOM from "react-dom/client";

import { AuthApp } from "./AuthApp";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing root element");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthApp />
  </React.StrictMode>,
);
