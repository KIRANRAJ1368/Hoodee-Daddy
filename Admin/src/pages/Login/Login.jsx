import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../services/api";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guarantee fields start 100% empty on mount, preventing unwanted browser autofill
  useEffect(() => {
    setEmail("");
    setPassword("");
    const timer = setTimeout(() => {
      setEmail("");
      setPassword("");
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Invalid email or password. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-viewport">
      {/* ── Modern Ambient Background Mesh ── */}
      <div className="login-mesh-orb login-mesh-top" aria-hidden="true" />
      <div className="login-mesh-orb login-mesh-bottom" aria-hidden="true" />
      <div className="login-grid-overlay" aria-hidden="true" />

      <div className="login-wrapper">
        <div className="login-card">
          {/* Brand Logo Presentation */}
          <div className="login-brand-header">
            <div className="login-logo-wrap">
              <img
                src="/images/hoodee-daddy-logo.png"
                alt="HooDee Daddy"
                className="login-logo-image"
              />
            </div>
            <span className="login-admin-pill">ADMIN PORTAL</span>
            <h1 className="login-heading">Welcome Back</h1>
          </div>

          {/* Validation & Error Alert */}
          {error && (
            <div className="login-error-alert" role="alert">
              <AlertCircle size={18} className="login-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Clean Minimal Login Form */}
          <form
            onSubmit={handleSubmit}
            className="login-form"
            autoComplete="off"
            noValidate
          >
            {/* Hidden decoy fields to divert aggressive browser password autofill */}
            <input
              type="text"
              name="prevent_autofill_username"
              tabIndex={-1}
              autoComplete="off"
              style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: "none" }}
              aria-hidden="true"
            />
            <input
              type="password"
              name="prevent_autofill_password"
              tabIndex={-1}
              autoComplete="new-password"
              style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: "none" }}
              aria-hidden="true"
            />

            {/* Email / Username Field */}
            <div className="login-form-group">
              <label htmlFor="login-email" className="login-label">
                Email
              </label>
              <div className="login-input-container">
                <Mail size={18} className="login-input-icon" />
                <input
                  id="login-email"
                  name="hd_admin_login_email"
                  type="text"
                  placeholder="Enter your email or username"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="login-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-form-group">
              <label htmlFor="login-password" className="login-label">
                Password
              </label>
              <div className="login-input-container">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="login-password"
                  name="hd_admin_login_secret"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="login-input login-input-password"
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Gold Action Button */}
            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting || !email.trim() || !password.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className="login-spinner" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="login-security-notice">
            <ShieldCheck size={14} className="login-security-icon" />
            <span>Authorized person only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
