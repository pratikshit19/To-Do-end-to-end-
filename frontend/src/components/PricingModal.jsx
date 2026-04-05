import { useState, useEffect, useCallback } from "react";
import {
  X, Crown, Check, Zap, Activity, Palette, FileSpreadsheet,
  Shield, Star, Sparkles, ArrowRight, Lock, CreditCard, ChevronLeft,
  Brain, Target, Flame, Users
} from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";
import useStore from "../store/useStore";

/* ─────────────────────────────────────────────
   CONFETTI helper (canvas-free, CSS-based)
───────────────────────────────────────────── */
const COLORS = ["#f97316", "#f59e0b", "#eab308", "#84cc16", "#22d3ee", "#a78bfa", "#ec4899"];

function ConfettiPiece({ style }) {
  return <div className="confetti-piece" style={style} />;
}

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      background: COLORS[i % COLORS.length],
      width: `${6 + Math.random() * 8}px`,
      height: `${6 + Math.random() * 8}px`,
      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      animationDelay: `${Math.random() * 0.8}s`,
      animationDuration: `${1.2 + Math.random() * 1.4}s`,
    }
  }));

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map(p => <ConfettiPiece key={p.id} style={p.style} />)}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FEATURE LISTS
───────────────────────────────────────────── */
const FREE_FEATURES = [
  "Unlimited Tasks",
  "Schedule & Calendar",
  "Basic Focus Timer",
  "7-day Insights",
  "1 Color Theme",
];

const PRO_FEATURES = [
  { icon: <Brain size={14} />, text: "Mind Sweep AI Task Parser", color: "text-purple-500" },
  { icon: <Sparkles size={14} />, text: "Chronotype Auto-Scheduler", color: "text-indigo-500" },
  { icon: <Target size={14} />, text: "Frog Eater Anti-Procrastination", color: "text-emerald-500" },
  { icon: <Flame size={14} />, text: "Burnout Predictor & Cooldown", color: "text-red-500" },
  { icon: <Users size={14} />, text: "Focus Buddy Multiplexer", color: "text-cyan-500" },
  { icon: <Activity size={14} />, text: "90-day Insights & Custom Themes", color: "text-blue-500" },
];

/* ─────────────────────────────────────────────
   STEP 1 — PRICING PLANS
───────────────────────────────────────────── */
function PricingStep({ onSelectPro, onClose }) {
  return (
    <div className="pricing-step">
      <div className="pricing-header">
        <div className="pricing-badge">
          <Crown size={14} className="fill-orange-400" />
          <span>Pro Membership</span>
        </div>
        <h2 className="pricing-title">
          Upgrade Your<br />
          <span className="pricing-gradient-text">Workspace</span>
        </h2>
        <p className="pricing-subtitle">Unlock the full power of TaskFlow with a single click.</p>
      </div>

      <div className="plans-grid">
        {/* FREE PLAN */}
        <div className="plan-card plan-free">
          <div className="plan-label">Free</div>
          <div className="plan-price">
            <span className="plan-amount">₹0</span>
            <span className="plan-period">/month</span>
          </div>
          <p className="plan-desc">Everything you need to get started.</p>
          <hr className="plan-divider" />
          <ul className="plan-features">
            {FREE_FEATURES.map(f => (
              <li key={f} className="plan-feature-item">
                <Check size={14} className="plan-check-icon plan-check-free" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="plan-current-badge">Current Plan</div>
        </div>

        {/* PRO PLAN */}
        <div className="plan-card plan-pro">
          <div className="plan-popular">Most Popular</div>
          <div className="plan-label plan-label-pro">Pro</div>
          <div className="plan-price">
            <span className="plan-amount plan-amount-pro">₹499</span>
            <span className="plan-period plan-period-pro">/month</span>
          </div>
          <p className="plan-desc plan-desc-pro">Everything in Free, plus premium superpowers.</p>
          <hr className="plan-divider plan-divider-pro" />
          <ul className="plan-features">
            {PRO_FEATURES.map(f => (
              <li key={f.text} className="plan-feature-item">
                <span className={`plan-feature-icon ${f.color}`}>{f.icon}</span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
          <button
            id="btn-get-pro-now"
            onClick={onSelectPro}
            className="plan-cta-btn"
          >
            Get Pro Now
            <ArrowRight size={16} className="cta-arrow" />
          </button>
        </div>
      </div>

      <div className="pricing-footer">
        <Lock size={12} />
        <span>Secure checkout</span>
        <span className="pricing-dot">•</span>
        <span>Cancel anytime</span>
        <span className="pricing-dot">•</span>
        <span>Instant activation</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 2 — RAZORPAY CHECKOUT LAUNCHER
───────────────────────────────────────────── */
function PaymentStep({ onBack, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const { upgradeToPro } = useStore();

  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (document.getElementById("razorpay-sdk")) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.id = "razorpay-sdk";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const handlePay = async () => {
    setLoading(true);

    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      toast.error("Failed to load payment SDK. Check your internet connection.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      // Create order on backend
      const orderRes = await fetch(`${API_BASE_URL}/create-order`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.message || "Failed to create order");
      }

      const { orderId, amount, currency, key } = await orderRes.json();

      const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
      const username = localStorage.getItem("username") || "User";

      const options = {
        key,
        amount,
        currency,
        name: "TaskFlow Pro",
        description: "Unlock all premium features",
        image: "", // Optional logo URL
        order_id: orderId,
        handler: async (response) => {
          try {
            // Verify signature on backend
            const verifyRes = await fetch(`${API_BASE_URL}/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              // Update store
              useStore.setState({ isPro: true });
              onSuccess();
            } else {
              const err = await verifyRes.json();
              toast.error(err.message || "Payment verification failed.");
            }
          } catch {
            toast.error("Payment verification error. Contact support.");
          }
        },
        prefill: {
          name: username,
          email: "",
          contact: "",
        },
        theme: {
          color: "#f97316",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast("Payment cancelled.", { icon: "ℹ️" });
          },
        },
      };

      /* global Razorpay */
      const rzp = new window.Razorpay(options);
      rzp.open();
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="payment-step">
      <button onClick={onBack} className="payment-back-btn" id="btn-payment-back">
        <ChevronLeft size={18} />
        Back to Plans
      </button>

      <div className="payment-content">
        {/* Order Summary */}
        <div className="order-summary">
          <div className="order-icon">
            <Crown size={28} className="fill-orange-400/30 text-orange-500" />
          </div>
          <div className="order-info">
            <h3 className="order-title">TaskFlow Pro — Monthly</h3>
            <p className="order-sub">All premium features unlocked immediately</p>
          </div>
          <div className="order-price">₹499</div>
        </div>

        {/* Feature checklist */}
        <div className="payment-features">
          {PRO_FEATURES.slice(0, 4).map(f => (
            <div key={f.text} className="payment-feature-row">
              <span className={`payment-feature-icon ${f.color}`}>{f.icon}</span>
              <span className="payment-feature-text">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Razorpay CTA */}
        <button
          id="btn-pay-now"
          onClick={handlePay}
          disabled={loading}
          className={`pay-btn ${loading ? "pay-btn-loading" : ""}`}
        >
          {loading ? (
            <span className="pay-loading-content">
              <span className="pay-spinner" />
              Connecting to Razorpay...
            </span>
          ) : (
            <span className="pay-btn-content">
              <CreditCard size={18} />
              Pay ₹499 Securely
            </span>
          )}
        </button>

        {/* Trust indicators */}
        <div className="payment-trust">
          <div className="trust-item">
            <Lock size={12} />
            <span>256-bit SSL encrypted</span>
          </div>
          <div className="trust-dot">•</div>
          <div className="trust-item">
            <Shield size={12} />
            <span>Powered by Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 3 — SUCCESS
───────────────────────────────────────────── */
function SuccessStep({ onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="success-step">
      <Confetti />
      <div className="success-crown-wrap">
        <div className="success-crown-ring">
          <Crown size={48} className="fill-orange-400/40 text-orange-500 success-crown-icon" />
        </div>
      </div>
      <h2 className="success-title">You're now Pro! 👑</h2>
      <p className="success-sub">All premium features are unlocked and ready to use.</p>
      <div className="success-features">
        {PRO_FEATURES.map(f => (
          <div key={f.text} className="success-feature-pill">
            <span className={f.color}>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>
      <button id="btn-success-done" onClick={onClose} className="success-done-btn">
        <Sparkles size={16} />
        Start Using Pro
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT — PricingModal
───────────────────────────────────────────── */
export default function PricingModal({ onClose }) {
  const [step, setStep] = useState("pricing"); // "pricing" | "payment" | "success"

  const handleSuccess = useCallback(() => {
    setStep("success");
  }, []);

  // Close on backdrop click (only on pricing step)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && step !== "payment") {
      onClose();
    }
  };

  return (
    <>
      {/* Inline styles for this modal */}
      <style>{`
        /* ── Confetti ── */
        .confetti-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 200;
          overflow: hidden;
        }
        .confetti-piece {
          position: absolute;
          top: -20px;
          animation: confetti-fall linear forwards;
        }
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }

        /* ── Overlay ── */
        .pricing-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(12px);
          z-index: 150;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: overlay-in 0.25s ease;
        }
        @keyframes overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Modal shell ── */
        .pricing-modal {
          position: relative;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 2rem;
          width: 100%;
          max-width: 860px;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 32px 80px -10px rgba(0,0,0,0.5);
          animation: modal-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        .modal-close {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          z-index: 10;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
          transition: background 0.15s, color 0.15s;
        }
        .modal-close:hover { background: var(--border); color: var(--text-primary); }

        /* ── Decorative blobs ── */
        .modal-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
        }
        .modal-blob-1 { width: 280px; height: 280px; top: -100px; left: -100px; background: rgba(249,115,22,0.06); }
        .modal-blob-2 { width: 250px; height: 250px; bottom: -80px; right: -80px; background: rgba(245,158,11,0.06); }

        /* ═══════════════════════════
             STEP 1 — PRICING
        ═══════════════════════════ */
        .pricing-step { padding: 2.5rem; }
        .pricing-header { text-align: center; margin-bottom: 2rem; }
        .pricing-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 999px;
          background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.2);
          color: #f97316; font-size: 11px; font-weight: 800;
          letter-spacing: 0.12em; text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .pricing-title {
          font-size: clamp(2rem, 5vw, 2.75rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }
        .pricing-gradient-text {
          background: linear-gradient(135deg, #f97316, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .pricing-subtitle {
          font-size: 0.9rem; font-weight: 500;
          color: var(--text-secondary); opacity: 0.7;
        }

        /* Plans grid */
        .plans-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1.75rem;
        }
        @media (max-width: 620px) { .plans-grid { grid-template-columns: 1fr; } }

        /* Plan card base */
        .plan-card {
          border-radius: 1.5rem;
          padding: 1.75rem;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .plan-free { background: var(--bg); }
        .plan-pro {
          background: linear-gradient(145deg, rgba(249,115,22,0.06), rgba(245,158,11,0.04));
          border-color: rgba(249,115,22,0.35);
          box-shadow: 0 0 40px -10px rgba(249,115,22,0.15);
        }

        .plan-popular {
          position: absolute; top: 1rem; right: 1rem;
          background: linear-gradient(135deg, #f97316, #f59e0b);
          color: white; font-size: 10px; font-weight: 800;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 3px 10px; border-radius: 999px;
        }

        .plan-label {
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.15em; text-transform: uppercase;
          opacity: 0.5; color: var(--text-primary);
        }
        .plan-label-pro { color: #f97316; opacity: 1; }

        .plan-price { display: flex; align-items: baseline; gap: 4px; margin: 4px 0; }
        .plan-amount { font-size: 2.5rem; font-weight: 900; color: var(--text-primary); }
        .plan-amount-pro { color: #f97316; }
        .plan-period { font-size: 0.85rem; font-weight: 600; opacity: 0.5; color: var(--text-primary); }
        .plan-period-pro { color: #f97316; opacity: 0.8; }

        .plan-desc { font-size: 0.8rem; opacity: 0.55; font-weight: 500; color: var(--text-primary); }
        .plan-desc-pro { opacity: 0.75; color: #f97316; }

        .plan-divider { border: none; border-top: 1px solid var(--border); margin: 0.75rem 0; }
        .plan-divider-pro { border-color: rgba(249,115,22,0.2); }

        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 0.55rem; flex: 1; }
        .plan-feature-item { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
        .plan-check-icon { flex-shrink: 0; }
        .plan-check-free { color: var(--accent); }
        .plan-feature-icon { flex-shrink: 0; }

        .plan-current-badge {
          margin-top: 1rem;
          text-align: center;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          opacity: 0.35;
        }
        .plan-cta-btn {
          margin-top: 1.25rem;
          width: 100%;
          padding: 0.9rem 1.5rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, #f97316, #f59e0b);
          color: white; font-weight: 800;
          font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 8px 24px -6px rgba(249,115,22,0.45);
          transition: transform 0.15s, box-shadow 0.15s;
          border: none; cursor: pointer;
        }
        .plan-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px -6px rgba(249,115,22,0.5); }
        .plan-cta-btn:active { transform: translateY(0); }
        .cta-arrow { transition: transform 0.2s; }
        .plan-cta-btn:hover .cta-arrow { transform: translateX(4px); }

        .pricing-footer {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          opacity: 0.35; color: var(--text-primary);
        }
        .pricing-dot { opacity: 0.5; }

        /* ═══════════════════════════
             STEP 2 — PAYMENT
        ═══════════════════════════ */
        .payment-step { padding: 2.5rem; max-width: 500px; margin: 0 auto; }
        .payment-back-btn {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.8rem; font-weight: 700;
          color: var(--text-secondary); opacity: 0.6;
          background: none; border: none; cursor: pointer;
          margin-bottom: 2rem;
          transition: opacity 0.15s;
        }
        .payment-back-btn:hover { opacity: 1; }

        .payment-content { display: flex; flex-direction: column; gap: 1.5rem; }

        .order-summary {
          display: flex; align-items: center; gap: 1rem;
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 1.25rem; padding: 1.25rem;
        }
        .order-icon {
          width: 3rem; height: 3rem;
          background: linear-gradient(135deg, rgba(249,115,22,0.15), rgba(245,158,11,0.1));
          border-radius: 0.875rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .order-info { flex: 1; }
        .order-title { font-size: 0.95rem; font-weight: 800; color: var(--text-primary); }
        .order-sub { font-size: 0.75rem; font-weight: 500; opacity: 0.55; color: var(--text-primary); margin-top: 2px; }
        .order-price { font-size: 1.35rem; font-weight: 900; color: #f97316; flex-shrink: 0; }

        .payment-features { display: flex; flex-direction: column; gap: 0.6rem; }
        .payment-feature-row { display: flex; align-items: center; gap: 10px; }
        .payment-feature-icon { flex-shrink: 0; }
        .payment-feature-text { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); opacity: 0.8; }

        .pay-btn {
          width: 100%; padding: 1rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, #f97316, #f59e0b);
          color: white; font-weight: 800;
          font-size: 0.9rem; letter-spacing: 0.08em;
          border: none; cursor: pointer;
          box-shadow: 0 8px 24px -6px rgba(249,115,22,0.4);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
        }
        .pay-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px -6px rgba(249,115,22,0.5); }
        .pay-btn:active:not(:disabled) { transform: translateY(0); }
        .pay-btn-loading { opacity: 0.75; cursor: not-allowed; }
        .pay-btn-content, .pay-loading-content {
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .pay-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .payment-trust {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.05em; opacity: 0.4; color: var(--text-primary);
        }
        .trust-item { display: flex; align-items: center; gap: 4px; }
        .trust-dot { opacity: 0.5; }

        /* ═══════════════════════════
             STEP 3 — SUCCESS
        ═══════════════════════════ */
        .success-step {
          padding: 3rem 2.5rem;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; gap: 1.25rem;
          min-height: 420px;
        }
        .success-crown-wrap {
          animation: crown-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes crown-pop {
          from { transform: scale(0) rotate(-15deg); opacity: 0; }
          to   { transform: scale(1) rotate(0);      opacity: 1; }
        }
        .success-crown-ring {
          width: 96px; height: 96px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(249,115,22,0.15), rgba(245,158,11,0.1));
          border: 2px solid rgba(249,115,22,0.25);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 40px rgba(249,115,22,0.2);
        }
        .success-crown-icon { animation: crown-glow 2s ease-in-out infinite; }
        @keyframes crown-glow {
          0%,100% { filter: drop-shadow(0 0 6px rgba(249,115,22,0.5)); }
          50%      { filter: drop-shadow(0 0 16px rgba(249,115,22,0.9)); }
        }
        .success-title {
          font-size: 2rem; font-weight: 900;
          color: var(--text-primary);
          animation: fade-up 0.4s 0.2s ease both;
        }
        .success-sub {
          font-size: 0.9rem; font-weight: 500;
          opacity: 0.6; color: var(--text-primary);
          animation: fade-up 0.4s 0.3s ease both;
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .success-features {
          display: flex; flex-wrap: wrap;
          gap: 0.5rem; justify-content: center;
          max-width: 440px;
          animation: fade-up 0.4s 0.4s ease both;
        }
        .success-feature-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 999px;
          background: var(--bg);
          border: 1px solid var(--border);
          font-size: 0.75rem; font-weight: 700;
          color: var(--text-primary);
        }
        .success-done-btn {
          margin-top: 0.5rem;
          padding: 0.9rem 2.5rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, #f97316, #f59e0b);
          color: white; font-weight: 800;
          font-size: 0.9rem; letter-spacing: 0.08em;
          border: none; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 8px 24px -6px rgba(249,115,22,0.4);
          transition: transform 0.15s;
          animation: fade-up 0.4s 0.5s ease both;
        }
        .success-done-btn:hover { transform: translateY(-2px); }
      `}</style>

      <div className="pricing-overlay" onClick={handleBackdropClick}>
        <div className="pricing-modal" role="dialog" aria-modal="true" aria-label="Pro Membership Pricing">
          {/* Decorative blobs */}
          <div className="modal-blob modal-blob-1" />
          <div className="modal-blob modal-blob-2" />

          {/* Close button (hidden during payment) */}
          {step !== "payment" && (
            <button
              id="btn-modal-close"
              onClick={onClose}
              className="modal-close"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          )}

          {/* Step renderer */}
          {step === "pricing" && (
            <PricingStep onSelectPro={() => setStep("payment")} onClose={onClose} />
          )}
          {step === "payment" && (
            <PaymentStep onBack={() => setStep("pricing")} onSuccess={handleSuccess} />
          )}
          {step === "success" && (
            <SuccessStep onClose={onClose} />
          )}
        </div>
      </div>
    </>
  );
}
