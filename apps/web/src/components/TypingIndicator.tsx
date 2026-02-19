import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="typing-indicator"
      aria-live="polite"
      aria-label="Assistant is typing"
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.15
          }}
        />
      ))}
    </motion.div>
  );
}
