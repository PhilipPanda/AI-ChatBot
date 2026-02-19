import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await register({
        name: name || undefined,
        email,
        password
      });
      toast.success("Account created");
      navigate("/chat", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.form
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="auth-card glass-panel"
        onSubmit={onSubmit}
      >
        <h1>Create account</h1>
        <p>Start with your own encrypted API key and private conversations.</p>

        <label>
          Name
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        <button type="submit" disabled={submitting} className="primary-btn">
          {submitting ? "Creating..." : "Create account"}
        </button>

        <span>
          Already have an account? <Link to="/login">Sign in</Link>
        </span>
      </motion.form>
    </div>
  );
}
