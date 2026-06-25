import React, { useState } from "react";
import { motion } from "motion/react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff } from "lucide-react";

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to registration or dashboard after login
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Auth error:", err);
      let friendlyMessage = "Authentication failed. Please check your credentials.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        friendlyMessage = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "This email is already in use.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] p-8 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        {/* Glow decorative blur */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[var(--color-ares-teal)]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[var(--color-ares-purple)]/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <header className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs text-[var(--color-ares-muted)] uppercase tracking-widest font-semibold">
              {isLogin ? "Sign in to participate" : "Register for the raffle & challenges"}
            </p>
          </header>

          {/* Toggle Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-[var(--color-ares-bg)] rounded-xl border border-[var(--color-ares-dark-purple)]">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                isLogin
                  ? "bg-[var(--color-ares-teal)] text-white shadow-md"
                  : "text-[var(--color-ares-muted)] hover:text-white"
              }`}
            >
              <LogIn size={14} /> Log In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                !isLogin
                  ? "bg-[var(--color-ares-teal)] text-white shadow-md"
                  : "text-[var(--color-ares-muted)] hover:text-white"
              }`}
            >
              <UserPlus size={14} /> Sign Up
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2.5"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1.5 px-1 font-bold">
                Email Address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@email.com"
                className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-ares-teal)] transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1.5 px-1 font-bold">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl pl-4 pr-11 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-ares-teal)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[var(--color-ares-muted)] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[var(--color-ares-teal)] text-white font-black tracking-widest uppercase rounded-xl hover:bg-opacity-90 disabled:opacity-50 glow-shadow transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Get Started"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
