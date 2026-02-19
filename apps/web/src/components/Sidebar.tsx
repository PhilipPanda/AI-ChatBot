import { motion } from "framer-motion";
import { Download, LogOut, MessageSquarePlus, Settings, Trash2 } from "lucide-react";
import type { ConversationSummary } from "../lib/types";

type SidebarProps = {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => Promise<void>;
  onRenameConversation: (conversationId: string, title: string) => Promise<void>;
  onDeleteConversation: (conversationId: string) => Promise<void>;
  onExportConversation: (conversationId: string, format: "markdown" | "json") => Promise<void>;
  onOpenSettings: () => void;
  onLogout: () => Promise<void>;
};

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
  onExportConversation,
  onOpenSettings,
  onLogout
}: SidebarProps) {
  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <h1>AI ChatBot</h1>
        <button type="button" className="icon-button" onClick={() => void onCreateConversation()}>
          <MessageSquarePlus size={18} />
        </button>
      </div>

      <div className="sidebar-list">
        {conversations.map((conversation) => {
          const active = conversation.id === activeConversationId;

          return (
            <motion.button
              key={conversation.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], layout: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } }}
              className={`conversation-item ${active ? "active" : ""}`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <span className="title">{conversation.title}</span>
              <span className="meta">{conversation.messageCount} msgs</span>
              <div className="conversation-actions">
                <button
                  type="button"
                  className="icon-button ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    const title = window.prompt("Rename conversation", conversation.title);
                    if (title?.trim()) {
                      void onRenameConversation(conversation.id, title.trim());
                    }
                  }}
                  aria-label="Rename"
                >
                  <Settings size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    void onExportConversation(conversation.id, "markdown");
                  }}
                  aria-label="Export"
                >
                  <Download size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button ghost danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    const confirmDelete = window.confirm("Delete this conversation?");
                    if (confirmDelete) {
                      void onDeleteConversation(conversation.id);
                    }
                  }}
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <button type="button" className="secondary-btn" onClick={onOpenSettings}>
          <Settings size={16} />
          Settings
        </button>
        <button type="button" className="secondary-btn" onClick={() => void onLogout()}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
