import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../../CartContext";
import { loginPageStyles } from "../../assets/dummyStyles";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { loadCart } = useCart();

  const API_BASE = "http://localhost:4000"; // change if needed

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic form validation
    if (!email || !password) {
      toast.error("Please fill in all fields.", {
        position: "top-right",
        autoClose: 4000,
        theme: "light",
      });
      return;
    }

    if (!rememberMe) {
      toast.error("You must agree to remember me.", {
        position: "top-right",
        autoClose: 4000,
        theme: "light",
      });
      return;
    }

    setSubmitting(true);

    try {
      const resp = await axios.post(
        `${API_BASE}/api/auth/login`,
        { email: email.trim().toLowerCase(), password },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = resp.data;
      console.log(data);

      // Expecting { success: true, token, user: { ... } }
      if (data && data.token) {
        // store token & user depending on rememberMe
        if (rememberMe) {
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("user", JSON.stringify(data.user ?? {}));
          localStorage.setItem("isLoggedIn", "true");
        } else {
          sessionStorage.setItem("authToken", data.token);
          sessionStorage.setItem("user", JSON.stringify(data.user ?? {}));
          sessionStorage.setItem("isLoggedIn", "true");
        }

        // notify other parts of the app (e.g., Navbar)
        try {
          window.dispatchEvent(
            new CustomEvent("authChanged", { detail: { loggedIn: true } })
          );
        } catch (err) {
          // ignore environments that restrict CustomEvent
        }

        toast.success(data.message || "Login successful!", {
          position: "top-right",
          autoClose: 1200,
          theme: "light",
        });

        // redirect to home (show toast briefly)
        setTimeout(() => {
          navigate("/");
        }, 1250);
      } else {
        toast.error(data.message || "Unexpected server response.", {
          position: "top-right",
          autoClose: 4000,
          theme: "light",
        });
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      const status = err?.response?.status;

      if (status === 401) {
        toast.error(serverMsg || "Invalid email or password.", {
          position: "top-right",
          autoClose: 4000,
          theme: "light",
        });
      } else if (status === 409) {
        toast.error(serverMsg || "Conflict: user exists.", {
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

      console.error("Login error:", err?.response ?? err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={loginPageStyles.pageContainer}
      style={loginPageStyles.playfairFontStyle}
    >
      <ToastContainer />

      {/* Main Content */}
      <div className={loginPageStyles.mainContent}>
        {/* Top-left back button */}
        <button
          onClick={() => navigate("/")}
          className={loginPageStyles.backButton}
          aria-label="Back to home"
        >
          <ArrowLeft className={loginPageStyles.backIcon} />
          <span className={loginPageStyles.backButtonText}>Back to Home</span>
        </button>

        {/* Main card with unique shape */}
        <div className={loginPageStyles.loginCard}>
          {/* Decorative corner elements */}
          <div className={loginPageStyles.decorativeTopLeft}></div>
          <div className={loginPageStyles.decorativeBottomRight}></div>

          <h2 className={loginPageStyles.cardTitle}>
            Welcome Back
          </h2>
          <p className={loginPageStyles.cardSubtitle}>
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit}>
            <div className={loginPageStyles.formField}>
              <label
                htmlFor="email"
                className={loginPageStyles.formLabel}
              >
                Email
              </label>
              <div className={loginPageStyles.inputContainer}>
                <div className={loginPageStyles.inputIconContainer}>
                  <User className={loginPageStyles.inputIcon} />
                </div>
                <input
                  type="email"
                  id="email"
                  className={loginPageStyles.inputBase}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={loginPageStyles.formField}>
              <label
                htmlFor="password"
                className={loginPageStyles.formLabel}
              >
                Password
              </label>
              <div className={loginPageStyles.inputContainer}>
                <div className={loginPageStyles.inputIconContainer}>
                  <Lock className={loginPageStyles.inputIcon} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className={loginPageStyles.passwordInputBase}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  className={loginPageStyles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={submitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className={loginPageStyles.passwordToggleIcon} />
                  ) : (
                    <Eye className={loginPageStyles.passwordToggleIcon} />
                  )}
                </button>
              </div>
            </div>

            <div className={loginPageStyles.rememberMeContainer}>
              <div className={loginPageStyles.checkboxContainer}>
                <input
                  id="rememberMe"
                  type="checkbox"
                  className={loginPageStyles.checkbox}
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  required
                  disabled={submitting}
                />
              </div>
              <div className={loginPageStyles.checkboxLabelContainer}>
                <label
                  htmlFor="rememberMe"
                  className={loginPageStyles.checkboxLabel}
                >
                  Remember me <span className={loginPageStyles.requiredStar}>*</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className={`${loginPageStyles.submitButton} ${submitting ? loginPageStyles.submitButtonDisabled : ""}`}
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className={loginPageStyles.signupContainer}>
            <span className={loginPageStyles.signupText}>
              Don't have an account?{" "}
            </span>
            <a href="/signup" className={loginPageStyles.signupLink}>
              Sign Up
            </a>
          </div>
        </div>
      </div>

      {/* Add font import */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');`}</style>
    </div>
  );
};

export default LoginPage;