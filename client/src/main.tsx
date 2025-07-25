import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import tg from "@twa-dev/sdk";
import App from "./App";
import "./style.css";

const queryClient = new QueryClient();

tg.ready();

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <App />
          </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
