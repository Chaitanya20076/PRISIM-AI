
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  Sparkles,
  Sun,
  Users,
  X,
  Zap,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  getApps,
  initializeApp,
} from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
} from "firebase/auth";
import "./login.css";

// Firebase client configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4y0wYGWPbl3eNqdVZ8T_kbLDhHzz7GxU",
  authDomain: "prism-ai-15e2d.firebaseapp.com",
  projectId: "prism-ai-15e2d",
  storageBucket: "prism-ai-15e2d.firebasestorage.app",
  messagingSenderId: "324183571701",
  appId: "1:324183571701:web:915c5f86f9062e734f19bc"
};

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const PROMO_SLIDES = [
  {
    eyebrow: "WELCOME TO PRISM AI",
    title: "Curiosity starts here.",
    description:
      "Explore the world of artificial intelligence with a community that loves to learn, build, and experiment.",
    accent: "Explore.",
  },
  {
    eyebrow: "LEARN BY BUILDING",
    title: "Turn ideas into impact.",
    description:
      "Find opportunities to create projects, collaborate with brilliant minds, and turn what you learn into something real.",
    accent: "Innovate.",
  },
  {
    eyebrow: "YOUR PEOPLE. YOUR NEXT IDEA.",
    title: "Better things happen together.",
    description:
      "Meet curious creators, take part in events, share your work, and grow with the PRISM AI community at RNSIT.",
    accent: "Impact.",
  },
  {
    eyebrow: "YOUR PRISM AI JOURNEY",
    title: "Your next chapter begins now.",
    description:
      "Sign in to stay connected with club activities, discover what's happening, and be part of what we build next.",
    accent: "Join us.",
  },
];

async function postJson(endpoint, body) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Cannot connect to the PRISM AI backend. Check that your backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
}

export default function Login() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("prism-theme") || "light";
    } catch {
      return "light";
    }
  });

  const [mode, setMode] = useState("login");
  const [signupStep, setSignupStep] = useState("details");
  const [slideIndex, setSlideIndex] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % PROMO_SLIDES.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("prism-theme", theme);
    } catch {
      // Theme preference is optional.
    }

    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setResendCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const currentSlide = PROMO_SLIDES[slideIndex];
  const isSignup = mode === "signup";
  const isOtpStep = isSignup && signupStep === "otp";

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("error");
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setSignupStep("details");
    setOtp("");
    setMessage("");
    setShowPassword(false);
  };

  // Step 1: Request a verification code from the backend.
  const handleSendOtp = async () => {
    clearMessage();

    if (!name.trim()) {
      showMessage("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      showMessage("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      showMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (!acceptedTerms) {
      showMessage("Please accept the community terms to continue.");
      return;
    }

    setLoading(true);

    try {
      const result = await postJson("/api/auth/send-otp", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setSignupStep("otp");
      setOtp("");
      setResendCountdown(result.resendAfterSeconds || 60);

      showMessage(
        result.message || "Verification code sent to your email.",
        "success"
      );
    } catch (error) {
      showMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP. The backend creates the verified Firebase account.
  // Then sign the new user in through the Firebase client SDK.
  const handleVerifyOtp = async () => {
    clearMessage();

    if (!/^\d{6}$/.test(otp.trim())) {
      showMessage("Enter the six-digit code sent to your email.");
      return;
    }

    setLoading(true);

    try {
      await postJson("/api/auth/verify-otp", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      showMessage("Email verified! You are now signed in.", "success");

      // This is the first successful sign-in for the account just created.
      window.location.assign("/onboarding");
    } catch (error) {
      showMessage(
        error.code === "auth/invalid-credential" ||
          error.code === "auth/user-not-found"
          ? "Your account was created, but sign-in failed. Please log in with your email and password."
          : error.message || "Could not verify your email."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    clearMessage();

    if (resendCountdown > 0 || loading) return;

    setLoading(true);

    try {
      const result = await postJson("/api/auth/send-otp", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setResendCountdown(result.resendAfterSeconds || 60);
      setOtp("");

      showMessage(result.message || "A new code has been sent.", "success");
    } catch (error) {
      showMessage(error.message);

      // The backend enforces a 60-second cooldown.
      if (error.message.includes("wait 60 seconds")) {
        setResendCountdown(60);
      }
    } finally {
      setLoading(false);
    }
  };

  // Normal Firebase email/password login.
  const handleLogin = async () => {
    clearMessage();

    if (!email.trim() || !password) {
      showMessage("Enter your email address and password.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      window.location.assign("/dashboard");
    } catch (error) {
      const errors = {
        "auth/invalid-credential":
          "Incorrect email or password. Please try again.",
        "auth/user-not-found":
          "No account was found for this email address.",
        "auth/wrong-password":
          "Incorrect email or password. Please try again.",
        "auth/invalid-email":
          "Please enter a valid email address.",
        "auth/too-many-requests":
          "Too many attempts. Please try again later.",
        "auth/network-request-failed":
          "Network error. Check your internet connection.",
        "auth/operation-not-allowed":
          "Email/password login is not enabled in Firebase Authentication.",
      };

      showMessage(
        errors[error.code] || error.message || "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  };

  // Sign in with the user's Google account through Firebase Authentication.
  const handleGoogleSignIn = async () => {
    clearMessage();
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const credential = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(credential);
      const isFirstSignIn = additionalInfo?.isNewUser === true;

      // New Google accounts see onboarding once; returning accounts go straight to the dashboard.
      window.location.assign(isFirstSignIn ? "/onboarding" : "/dashboard");
    } catch (error) {
      const errors = {
        "auth/popup-closed-by-user": "The Google sign-in window was closed before completing sign-in.",
        "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
        "auth/cancelled-popup-request": "A Google sign-in request is already in progress.",
        "auth/account-exists-with-different-credential": "An account already exists with this email using a different sign-in method. Please use that method.",
        "auth/unauthorized-domain": "This domain is not authorised for Google sign-in. Add it in Firebase Authentication settings.",
        "auth/operation-not-allowed": "Google sign-in is not enabled in Firebase Authentication.",
        "auth/network-request-failed": "Network error. Check your internet connection and try again.",
      };

      showMessage(
        errors[error.code] || error.message || "Google sign-in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessage();

    if (!email.trim()) {
      showMessage("Enter your email address first.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim().toLowerCase()
      );

      showMessage(
        "If an account exists for that email, Firebase will send a password reset email.",
        "success"
      );
    } catch (error) {
      showMessage(
        error.code === "auth/invalid-email"
          ? "Please enter a valid email address."
          : error.code === "auth/too-many-requests"
            ? "Too many requests. Please try again later."
            : error.message || "Could not send the password reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (loading) return;

    if (isOtpStep) {
      handleVerifyOtp();
    } else if (isSignup) {
      handleSendOtp();
    } else {
      handleLogin();
    }
  };

  return (
    <main
      className={`prism-auth-page ${
        theme === "dark" ? "prism-auth-dark" : "prism-auth-light"
      }`}
    >
      <button
        className="prism-auth-back-button"
        type="button"
        onClick={() => window.location.assign("http://localhost:5173/")}
        aria-label="Back to PRISM AI home"
        title="Back to home"
      >
        <ArrowLeft size={17} />
        <span>Back to home</span>
      </button>

      <button
        className="prism-auth-theme-toggle"
        type="button"
        onClick={() =>
          setTheme((current) => (current === "dark" ? "light" : "dark"))
        }
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>

      <section className="prism-auth-promo" aria-label="About PRISM AI">
        <div className="prism-auth-orb prism-auth-orb-one" />
        <div className="prism-auth-orb prism-auth-orb-two" />
        <div className="prism-auth-grid" />

        <a className="prism-auth-brand" href="/" aria-label="PRISM AI home">
          <span className="prism-auth-brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="prism-auth-brand-copy">
            <strong>PRISM AI</strong>
            <small>RNS INSTITUTE OF TECHNOLOGY</small>
          </span>
        </a>

        <div className="prism-auth-promo-content" key={slideIndex}>
          <div className="prism-auth-eyebrow">
            <span className="prism-auth-eyebrow-dot" />
            {currentSlide.eyebrow}
          </div>

          <h1>
            {currentSlide.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span>{currentSlide.title.split(" ").slice(-1)[0]}</span>
          </h1>

          <p>{currentSlide.description}</p>

          <div className="prism-auth-feature-row">
            <span>
              <Sparkles size={15} /> Explore ideas
            </span>
            <span>
              <Zap size={15} /> Build projects
            </span>
            <span>
              <Users size={15} /> Find your community
            </span>
          </div>

          <div
            className="prism-auth-slide-controls"
            aria-label="Promotional slides"
          >
            {PROMO_SLIDES.map((slide, index) => (
              <button
                key={slide.eyebrow}
                type="button"
                className={index === slideIndex ? "is-active" : ""}
                onClick={() => setSlideIndex(index)}
                aria-label={`Show slide ${index + 1}: ${slide.eyebrow}`}
                aria-pressed={index === slideIndex}
              />
            ))}
          </div>
        </div>

        <div className="prism-auth-promo-footer">
          <span>EXPLORE. INNOVATE. IMPACT.</span>
          <span className="prism-auth-footer-divider" />
          <span>Built for curious minds.</span>
        </div>

        <div className="prism-auth-floating-card prism-auth-floating-card-top">
          <span className="prism-auth-floating-icon">
            <Sparkles size={17} />
          </span>
          <span>
            <strong>Stay curious</strong>
            <small>There's always more to discover.</small>
          </span>
        </div>

        <div className="prism-auth-floating-card prism-auth-floating-card-bottom">
          <span className="prism-auth-floating-icon">
            <Zap size={17} />
          </span>
          <span>
            <strong>Make something real</strong>
            <small>Your ideas deserve a start.</small>
          </span>
        </div>
      </section>

      <section className="prism-auth-form-side">
        <div className="prism-auth-form-wrap">
          <a
            className="prism-auth-mobile-brand"
            href="/"
            aria-label="PRISM AI home"
          >
            <span className="prism-auth-brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="prism-auth-brand-copy">
              <strong>PRISM AI</strong>
              <small>RNS INSTITUTE OF TECHNOLOGY</small>
            </span>
          </a>

          <div className="prism-auth-form-heading">
            <div className="prism-auth-welcome-icon">
              {isOtpStep ? (
                <ShieldCheck size={20} />
              ) : (
                <Sparkles size={20} />
              )}
            </div>

            <span className="prism-auth-form-kicker">
              {isOtpStep
                ? "EMAIL VERIFICATION"
                : isSignup
                  ? "BECOME PART OF THE COMMUNITY"
                  : "YOUR COMMUNITY AWAITS"}
            </span>

            <h2>
              {isOtpStep
                ? "Check your inbox."
                : isSignup
                  ? "Create your account"
                  : "Welcome back."}
            </h2>

            <p>
              {isOtpStep
                ? `Enter the six-digit code sent to ${email}.`
                : isSignup
                  ? "Set up your account and start exploring PRISM AI."
                  : "Sign in to continue your PRISM AI journey."}
            </p>
          </div>

          {!isOtpStep && (
            <div
              className="prism-auth-mode-switch"
              role="tablist"
              aria-label="Authentication mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!isSignup}
                className={!isSignup ? "is-active" : ""}
                onClick={() => changeMode("login")}
                disabled={loading}
              >
                Login
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={isSignup}
                className={isSignup ? "is-active" : ""}
                onClick={() => changeMode("signup")}
                disabled={loading}
              >
                Sign up
              </button>
            </div>
          )}

          <form className="prism-auth-form" onSubmit={handleSubmit}>
            {isOtpStep ? (
              <>
                <label className="prism-auth-field">
                  <span>Verification code</span>
                  <div className="prism-auth-input-wrap">
                    <ShieldCheck size={17} />
                    <input
                      type="text"
                      name="otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(event) =>
                        setOtp(
                          event.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                      autoFocus
                    />
                  </div>
                  <small className="prism-auth-field-hint">
                    The code expires after 10 minutes. Check your spam folder
                    if you don't see the email.
                  </small>
                </label>

                <button
                  className="prism-auth-text-button"
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendCountdown > 0}
                >
                  <RefreshCw size={14} />
                  {resendCountdown > 0
                    ? `Resend code in ${resendCountdown}s`
                    : "Resend verification code"}
                </button>
              </>
            ) : (
              <>
                {isSignup && (
                  <label className="prism-auth-field">
                    <span>Full name</span>
                    <div className="prism-auth-input-wrap">
                      <Users size={17} />
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                        maxLength={100}
                      />
                    </div>
                  </label>
                )}

                <label className="prism-auth-field">
                  <span>Email address</span>
                  <div className="prism-auth-input-wrap">
                    <Mail size={17} />
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </label>

                <label className="prism-auth-field">
                  <span>Password</span>
                  <div className="prism-auth-input-wrap">
                    <LockKeyhole size={17} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete={
                        isSignup ? "new-password" : "current-password"
                      }
                      placeholder={
                        isSignup
                          ? "Create a strong password"
                          : "Enter your password"
                      }
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={isSignup ? 8 : undefined}
                      required
                    />

                    <button
                      className="prism-auth-password-toggle"
                      type="button"
                      onClick={() =>
                        setShowPassword((visible) => !visible)
                      }
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>

                  {isSignup && (
                    <small className="prism-auth-field-hint">
                      Use at least 8 characters.
                    </small>
                  )}
                </label>

                {!isSignup && (
                  <div className="prism-auth-form-options">
                    <label className="prism-auth-checkbox">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      className="prism-auth-text-button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {isSignup && (
                  <label className="prism-auth-checkbox prism-auth-terms">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) =>
                        setAcceptedTerms(event.target.checked)
                      }
                    />
                    <span>
                      I agree to the community terms and privacy policy.
                    </span>
                  </label>
                )}
              </>
            )}

            {message && (
              <div
                className="prism-auth-message"
                role="status"
                data-type={messageType}
              >
                <span>{message}</span>
                <button
                  type="button"
                  onClick={clearMessage}
                  aria-label="Dismiss message"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <button
              className="prism-auth-submit"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Please wait..."
                  : isOtpStep
                    ? "Verify email & create account"
                    : isSignup
                      ? "Send verification code"
                      : "Sign in"}
              </span>
              {loading ? (
                <RefreshCw className="prism-auth-spinner" size={18} />
              ) : (
                <ArrowRight size={18} />
              )}
            </button>

            {!isOtpStep && (
              <>
                <div className="prism-auth-or-divider" aria-hidden="true">
                  <span />
                  <small>OR CONTINUE WITH</small>
                  <span />
                </div>

                <button
                  className="prism-auth-google-button"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg
                    className="prism-auth-google-icon"
                    viewBox="0 0 48 48"
                    role="img"
                    aria-label="Google"
                  >
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.03 13.22l7.98 6.19C12.9 13.72 18.02 9.5 24 9.5Z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.9c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.38 37.98 46.98 31.86 46.98 24.55Z" />
                    <path fill="#FBBC05" d="M10.99 28.59A14.4 14.4 0 0 1 10.22 24c0-1.59.27-3.12.76-4.59L3 13.22A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l8.43-6.19Z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-5.98 0-11.1-4.22-12.99-9.91L3.03 34.78C6.51 42.62 14.62 48 24 48Z" />
                  </svg>
                  <span>{isSignup ? "Sign up with Google" : "Continue with Google"}</span>
                  <span className="prism-auth-google-arrow"><ArrowRight size={16} /></span>
                </button>
              </>
            )}

            {isOtpStep && (
              <button
                className="prism-auth-text-button"
                type="button"
                onClick={() => {
                  setSignupStep("details");
                  setOtp("");
                  clearMessage();
                }}
                disabled={loading}
              >
                Back to signup details
              </button>
            )}
          </form>

          {!isOtpStep && (
            <p className="prism-auth-switch-copy">
              {isSignup ? "Already have an account?" : "New to PRISM AI?"}{" "}
              <button
                type="button"
                onClick={() => changeMode(isSignup ? "login" : "signup")}
                disabled={loading}
              >
                {isSignup ? "Log in" : "Create an account"}
              </button>
            </p>
          )}

          <div className="prism-auth-form-bottom">
            <span className="prism-auth-bottom-line" />
            <span>PRISM AI · RNSIT</span>
            <span className="prism-auth-bottom-line" />
          </div>
        </div>
      </section>
    </main>
  );
}
