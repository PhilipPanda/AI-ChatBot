import { useRef, useState, type KeyboardEvent } from "react";
import { Cpu, Flame, Lightbulb, Paperclip, SendHorizonal, Shield, Sparkles, X, Zap } from "lucide-react";

type ChatComposerProps = {
  onSend: (message: string, attachments?: File[]) => Promise<void>;
  disabled?: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  activeMode: string | null;
  onModeChange: (mode: string | null) => void;
};

const MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"];

const MODES = [
  { id: "honest", label: "Brutally Honest", icon: Flame },
  { id: "creative", label: "Creative", icon: Sparkles },
  { id: "concise", label: "Concise", icon: Zap },
  { id: "explain", label: "Explain Like I'm 5", icon: Lightbulb },
  { id: "secure", label: "Security Audit", icon: Shield },
];

export function ChatComposer({ onSend, disabled, selectedModel, onModelChange, activeMode, onModeChange }: ChatComposerProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const submit = async () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) {
      return;
    }

    setMessage("");
    const files = attachments.length > 0 ? [...attachments] : undefined;
    setAttachments([]);
    await onSend(trimmed, files);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="composer-wrapper">
      <div className="composer-top-row">
        <span className="model-chip">
          <Cpu size={12} />
          <select
            value={selectedModel}
            onChange={(event) => onModelChange(event.target.value)}
            disabled={disabled}
          >
            {MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </span>

        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              className={`mode-chip ${isActive ? "active" : ""}`}
              onClick={() => onModeChange(isActive ? null : mode.id)}
              disabled={disabled}
              title={mode.label}
            >
              <Icon size={12} />
              {mode.label}
            </button>
          );
        })}
      </div>

      {attachments.length > 0 && (
        <div className="attached-files">
          {attachments.map((file, index) => (
            <span key={`${file.name}-${index}`} className="attached-file">
              <Paperclip size={11} />
              {file.name.length > 24 ? `${file.name.slice(0, 21)}...` : file.name}
              <button type="button" className="remove-file" onClick={() => removeAttachment(index)}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="composer-input-row">
        <button type="button" className="attach-btn" onClick={handleFileSelect} disabled={disabled} title="Attach files or images">
          <Paperclip size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css"
          style={{ display: "none" }}
          onChange={handleFilesChosen}
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask anything..."
          rows={1}
          disabled={disabled}
        />
        <button type="button" onClick={() => void submit()} disabled={disabled || !message.trim()} className="send-btn">
          <SendHorizonal size={16} />
        </button>
      </div>
    </div>
  );
}
