import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SettingsPage } from "./pages/SettingsPage";

function SettingsShell() {
  const navigate = useNavigate();

  return (
    <div className="settings-shell">
      <header>
        <button type="button" className="secondary-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>
        <h1>Settings</h1>
      </header>
      <SettingsPage />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsShell />} />
      </Route>

      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}
