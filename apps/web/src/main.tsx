import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { App } from "./App";
import { AuthProvider } from "./hooks/useAuth";
import "highlight.js/styles/github-dark.css";
import "./styles/global.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#1a1d28",
                color: "#e2e6ef",
                border: "1px solid rgba(130, 145, 175, 0.15)",
                borderRadius: "10px",
                fontSize: "14px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
              },
              success: {
                iconTheme: { primary: "#5b9cf5", secondary: "#1a1d28" }
              },
              error: {
                iconTheme: { primary: "#f06878", secondary: "#1a1d28" }
              }
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
