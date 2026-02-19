import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { analyticsApi, settingsApi, userApi } from "../lib/api";
import type { Settings, UsagePoint } from "../lib/types";
import { useAuth } from "../hooks/useAuth";

const MODEL_OPTIONS = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"];

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [usage, setUsage] = useState<UsagePoint[]>([]);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsData, usageData] = await Promise.all([settingsApi.get(), analyticsApi.getUsage()]);
        setSettings(settingsData);
        setUsage(usageData.usage);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user?.name, user?.email]);

  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.dataset.theme = settings.theme;
    }
  }, [settings?.theme]);

  const tokenTotal = useMemo(() => usage.reduce((sum, point) => sum + point.totalTokens, 0), [usage]);

  if (loading || !settings || !user) {
    return <div className="screen-loader">Loading settings...</div>;
  }

  const saveProfile = async () => {
    try {
      await userApi.updateProfile({ name, email });
      await refreshUser();
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    }
  };

  const saveApiKey = async () => {
    try {
      await settingsApi.setApiKey(apiKey);
      setApiKey("");
      setSettings((prev) => (prev ? { ...prev, hasApiKey: true } : prev));
      await refreshUser();
      toast.success("API key saved securely");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save API key");
    }
  };

  const removeApiKey = async () => {
    try {
      await settingsApi.removeApiKey();
      setSettings((prev) => (prev ? { ...prev, hasApiKey: false } : prev));
      await refreshUser();
      toast.success("API key removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove API key");
    }
  };

  const savePreferences = async () => {
    try {
      const response = await settingsApi.updatePreferences({
        preferredModel: settings.preferredModel,
        systemPrompt: settings.systemPrompt,
        theme: settings.theme
      });
      setSettings({
        ...settings,
        ...response.settings,
        hasApiKey: settings.hasApiKey
      });
      await refreshUser();
      toast.success("Preferences saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save preferences");
    }
  };

  return (
    <div className="settings-page">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0 }} className="glass-panel settings-section">
        <h2>Profile</h2>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        <button type="button" className="primary-btn" onClick={() => void saveProfile()}>
          Save Profile
        </button>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.08 }} className="glass-panel settings-section">
        <h2>OpenAI API Key</h2>
        <p className="muted">Your key is encrypted at rest and only used server-side for OpenAI calls.</p>
        <label>
          API Key
          <input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={settings.hasApiKey ? "Stored securely (enter new key to rotate)" : "sk-..."}
            type="password"
          />
        </label>
        <div className="button-row">
          <button type="button" className="primary-btn" onClick={() => void saveApiKey()} disabled={!apiKey.trim()}>
            Save API Key
          </button>
          {settings.hasApiKey ? (
            <button type="button" className="secondary-btn" onClick={() => void removeApiKey()}>
              Remove Key
            </button>
          ) : null}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.16 }} className="glass-panel settings-section">
        <h2>Preferences</h2>
        <label>
          Default model
          <select
            value={settings.preferredModel}
            onChange={(event) => setSettings((prev) => (prev ? { ...prev, preferredModel: event.target.value } : prev))}
          >
            {MODEL_OPTIONS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>

        <label>
          System prompt
          <textarea
            value={settings.systemPrompt ?? ""}
            onChange={(event) =>
              setSettings((prev) => (prev ? { ...prev, systemPrompt: event.target.value || null } : prev))
            }
            rows={4}
            placeholder="Optional behavior instructions for the assistant"
          />
        </label>

        <label>
          Theme
          <select
            value={settings.theme}
            onChange={(event) =>
              setSettings((prev) =>
                prev ? { ...prev, theme: event.target.value as "dark" | "light" } : prev
              )
            }
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>

        <button type="button" className="primary-btn" onClick={() => void savePreferences()}>
          Save Preferences
        </button>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.24 }} className="glass-panel settings-section">
        <h2>Usage Analytics</h2>
        <p className="muted">Last 30 days: {tokenTotal.toLocaleString()} tokens</p>
        <div className="usage-list">
          {usage.length === 0 ? <p className="muted">No usage yet</p> : null}
          {usage.map((point) => (
            <div key={point.id} className="usage-item">
              <span>{new Date(point.date).toLocaleDateString()}</span>
              <span>{point.requests} requests</span>
              <span>{point.totalTokens} tokens</span>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
