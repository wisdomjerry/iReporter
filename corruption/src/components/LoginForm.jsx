// src/components/LoginForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, CheckCircle, XCircle } from "lucide-react";
import apiService from "../services/api";
import { useUsers } from "../contexts/UserContext"; // ⭐ NOTE: Need to get refreshUser here
import API_BASE_URL from "../config/api";

// ... (AuthInput and StatusMessage components remain unchanged) ...

const LoginForm = () => {
  const navigate = useNavigate();
  // ⭐ UPDATED: Get refreshUser from context
  const { refreshUser } = useUsers(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: null, message: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email))
      newErrors.email = "Invalid email format";

    if (!password.trim()) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus({ type: null, message: "" });
    setLoading(true);

    try {
      // 1️⃣ Login: This saves the token to localStorage and returns the user object.
      const res = await apiService.login(email, password);

      // 2️⃣ Trigger UserContext to fetch the full user and set context state
      await refreshUser(); // <--- ⭐ CRITICAL CHANGE: Use the centralized context logic

      // The refreshed user is now guaranteed to be in the context state (currentUser)
      const role = res.user?.role; // We get the role from the initial login response for quick redirect

      // 3️⃣ Success message
      setStatus({
        type: "success",
        message: "Login successful! Redirecting...",
      });

      // 4️⃣ Redirect based on role
      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
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

  return (
    <div className="flex flex-col bg-slate-100 p-8 sm:p-12 lg:p-16 justify-center">
      <h2 className="text-3xl font-extrabold mb-2 text-red-600">
        Welcome Back!
      </h2>
      <p className="text-red-600 mb-6">Log in to continue</p>

      <StatusMessage type={status.type} message={status.message} />

      <form onSubmit={handleLogin} className="w-full" noValidate>
        <div className="mb-4">
          <AuthInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              // Removed redundant validate() call here as it runs on submit
            }}
            placeholder="wisdom@example.com"
            icon={Mail}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div className="mb-4">
          <AuthInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              // Removed redundant validate() call here as it runs on submit
            }}
            placeholder="••••••••"
            icon={Lock}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-2 bg-red-500 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <div className="animate-spin h-5 w-5 border-[3px] border-white border-t-transparent rounded-full"></div>
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
          onClick={() => navigate("/registration")}
          className="text-red-500 hover:underline cursor-pointer"
        >
          Sign up
        </span>
      </p>
    </div>
  );
};

export default LoginForm;