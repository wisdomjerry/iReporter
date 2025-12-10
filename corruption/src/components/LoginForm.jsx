// src/components/LoginForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, CheckCircle, XCircle } from "lucide-react";
import apiService from "../services/api";
import { useUsers } from "../contexts/UserContext";

// ──────────────────────────────────────────────
//  AuthInput Component
// ──────────────────────────────────────────────
const AuthInput = ({ label, type, value, onChange, placeholder, icon: Icon }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="mb-5">
      <label className="block text-xs font-semibold uppercase mb-1 text-red-600">
        {label}
      </label>

      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full p-3 pl-10 pr-10 rounded-lg placeholder:text-xs border border-red-200 shadow-sm focus:ring-2 focus:outline-none"
        />

        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
//  StatusMessage Component
// ──────────────────────────────────────────────
const StatusMessage = ({ type, message }) => {
  if (!message) return null;

  const Icon = type === "success" ? CheckCircle : XCircle;
  const color =
    type === "success"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  return (
    <div className={`flex items-center p-3 mb-4 rounded-lg text-sm ${color}`}>
      <Icon className="w-5 h-5 mr-3" />
      <p className="font-medium">{message}</p>
    </div>
  );
};

// ──────────────────────────────────────────────
//  LoginForm Component
// ──────────────────────────────────────────────
const LoginForm = () => {
  const navigate = useNavigate();
  const { refreshUser } = useUsers();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: null, message: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ─── Validation ───────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email))
      newErrors.email = "Invalid email format";

    if (!password.trim()) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Login Handler ────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const res = await apiService.login(email, password);

      await refreshUser(); // refresh user context

      const role = res.user?.role;

      setStatus({ type: "success", message: "Login successful! Redirecting..." });

      setTimeout(() => {
        navigate(role === "admin" ? "/admin" : "/dashboard");
      }, 1200);
    } catch (err) {
      console.error("Login error:", err);

      setStatus({
        type: "error",
        message: err.response?.data?.message || "Invalid email or password",
      });
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  //  UI
  // ──────────────────────────────────────────────
  return (
    <div className="flex flex-col justify-center bg-slate-100 p-8 sm:p-12 lg:p-16">
      <h2 className="text-3xl font-extrabold mb-2 text-red-600">
        Welcome Back!
      </h2>
      <p className="text-red-600 mb-6">Log in to continue</p>

      <StatusMessage type={status.type} message={status.message} />

      <form onSubmit={handleLogin} noValidate className="w-full">
        <AuthInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="wisdom@example.com"
          icon={Mail}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}

        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={Lock}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-2 bg-red-500 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center justify-center disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-2" />
              Login
            </>
          )}
        </button>
      </form>

      <p className="text-black-600 text-center mt-4 text-sm">
        Don't have an account?{" "}
        <span
          className="text-red-500 hover:underline cursor-pointer"
          onClick={() => navigate("/registration")}
        >
          Sign up
        </span>
      </p>
    </div>
  );
};

export default LoginForm;
