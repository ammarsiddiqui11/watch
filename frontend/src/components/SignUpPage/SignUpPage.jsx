import React, { useState } from "react";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { signUpStyles } from "../../assets/dummyStyles";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const API_BASE = "http://localhost:4000"; // adjust if different

  const handleSubmit = async (e) => {
    e.preventDefault();

    // enforce all fields
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in all fields.", {
        position: "top-right",
        autoClose: 4000,
        theme: "light",
      });
      return;
    }

    // simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.", {
        position: "top-right",
        autoClose: 4000,
        theme: "light",
      });
      return;
    }

    // require remember me explicitly (keeps your original UX)
    if (!rememberMe) {
      toast.error("Please tick 'Remember me' to continue.", {
        position: "top-right",
        autoClose: 4000,
        theme: "light",
      });
      return;
    }

    setSubmitting(true);

    try {
      const resp = await axios.post(
        `${API_BASE}/api/auth/register`,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = resp.data;

      // Expecting { success: true, token, user: { ... } }
      if (data && data.token) {
        // store token depending on rememberMe
        if (rememberMe) {
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("user", JSON.stringify(data.user ?? {}));
        } else {
          sessionStorage.setItem("authToken", data.token);
          sessionStorage.setItem("user", JSON.stringify(data.user ?? {}));
        }

        toast.success(data.message || "Signup successful", {
          position: "top-right",
          autoClose: 1200,
          theme: "light",
        });

        // redirect to login (short delay so user sees toast)
        setTimeout(() => {
          navigate("/login");
        }, 1250);
      } else {
        toast.error(data.message || "Unexpected server response.", {
          position: "top-right",
          autoClose: 4000,
          theme: "light",
        });
      }
    } catch (err) {
      // Prefer server-provided message if available
      const serverMsg = err?.response?.data?.message;
      const status = err?.response?.status;

      if (status === 409) {
        toast.error(serverMsg || "User already exists.", {
          position: "top-right",
          autoClose: 4000,
          theme: "light",
        });
      } else if (serverMsg) {
        toast.error(serverMsg, {
          position: "top-right",
          autoClose: 4000,
          theme: "light",
        });
      } else {
        toast.error("Server error. Please try again later.", {
          position: "top-right",
          autoClose: 4000,
          theme: "light",
        });
      }
      console.error("Signup error:", err?.response ?? err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={signUpStyles.pageContainer}
      style={signUpStyles.pageFontStyle}
    >
      <ToastContainer />

      <button
        aria-label="Back to home"
        onClick={() => navigate("/login")}
        className={signUpStyles.backButton}
      >
        <ArrowLeft className={signUpStyles.backIcon} />
        <span className={signUpStyles.backText}>Back to Login</span>
      </button>

      <div className={signUpStyles.formContainer}>
        <div className={signUpStyles.card}>
          <div className={signUpStyles.decorativeCircle}></div>

          <h1
            className={signUpStyles.title}
            style={signUpStyles.titleFontStyle}
          >
            Create account
          </h1>
          <p className={signUpStyles.subtitle}>
            Simple signup to get you started — light & clean.
          </p>

          <form onSubmit={handleSubmit} className={signUpStyles.form}>
            <label className={signUpStyles.label}>Full name</label>
            <div className={signUpStyles.inputContainer}>
              <div className={signUpStyles.inputIconContainer}>
                <User className={signUpStyles.inputIcon} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className={signUpStyles.inputField}
                disabled={submitting}
              />
            </div>

            <label className={signUpStyles.label}>Email</label>
            <div className={signUpStyles.inputContainer}>
              <div className={signUpStyles.inputIconContainer}>
                <Mail className={signUpStyles.inputIcon} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={signUpStyles.inputField}
                disabled={submitting}
              />
            </div>

            <div>
              <label className={signUpStyles.label}>Password</label>
              <div className={signUpStyles.inputContainer}>
                <div className={signUpStyles.inputIconContainer}>
                  <Lock className={signUpStyles.inputIcon} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className={signUpStyles.passwordInputField}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={signUpStyles.passwordToggleButton}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff className={signUpStyles.passwordToggleIcon} />
                  ) : (
                    <Eye className={signUpStyles.passwordToggleIcon} />
                  )}
                </button>
              </div>
            </div>

            <div className={signUpStyles.checkboxContainer}>
              <label className={signUpStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  required
                  className={signUpStyles.checkboxInput}
                  disabled={submitting}
                />
                <span className={signUpStyles.checkboxText}>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              className={`${signUpStyles.submitButton} ${submitting ? signUpStyles.submitButtonDisabled : ""}`}
              disabled={submitting}
            >
              {submitting ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <div className={signUpStyles.bottomContainer}>
            <span className={signUpStyles.bottomText}>
              Already have an account?{" "}
            </span>
            <a href="/login" className={signUpStyles.loginLink}>
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}