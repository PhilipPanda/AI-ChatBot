import { motion } from "framer-motion";
import { RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Message } from "../lib/types";
import { CodeBlock } from "./CodeBlock";

type MessageBubbleProps = {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: (messageId: string) => void;
};

export function MessageBubble({ message, isStreaming, onRegenerate }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={`message ${message.role}`}
    >
      <div className="message-header">
        <span className="message-role">{message.role === "user" ? "You" : "Assistant"}</span>
        {isAssistant && !isStreaming && onRegenerate ? (
          <button
            type="button"
            className="icon-button ghost"
            title="Regenerate response"
            onClick={() => onRegenerate(message.id)}
          >
            <RefreshCcw size={15} />
          </button>
        ) : null}
      </div>

      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            code(props: any) {
              const { children, className, inline } = props;
              const text = String(children).replace(/\n$/, "");
              const language = /language-(\w+)/.exec(className ?? "")?.[1];

              if (inline) {
                return <code className="inline-code">{children}</code>;
              }

              return <CodeBlock code={text} language={language} />;
            },
            a(props) {
              return <a {...props} target="_blank" rel="noreferrer" />;
            }
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </motion.article>
  );
}
