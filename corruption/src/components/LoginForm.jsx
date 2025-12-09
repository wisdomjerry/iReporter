// src/components/LoginForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, CheckCircle, XCircle } from "lucide-react";
import apiService from "../services/api";
import { useUsers } from "../contexts/UserContext";
import API_BASE_URL from "../config/api";

const AuthInput = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
}) => {
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
          className="w-full p-3 pl-10 pr-10 placeholder:text-xs rounded-lg border border-red-200 shadow-sm focus:outline-none focus:ring-2"
        />

        <Icon className="absolute text-red-500 left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />

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

const StatusMessage = ({ type, message }) => {
  if (!message) return null;
  const Icon = type === "success" ? CheckCircle : XCircle;
  const colorClass =
    type === "success"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  return (
    <div
      className={`flex items-center p-3 mb-4 rounded-lg text-sm ${colorClass}`}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <p className="font-medium">{message}</p>
    </div>
  );
};

const LoginForm = () => {
  const navigate = useNavigate();
  const { setCurrentUser, markFirstLoginSeen } = useUsers();

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
      // 1️⃣ Login
      await apiService.login(email, password);

      // 2️⃣ Fetch current user
      const fullUser = await apiService.getCurrentUser();

      // 3️⃣ Set user in context including firstLoginShown
      setCurrentUser({
        ...fullUser.user,
        avatar: fullUser.user.avatar || "",
        firstName: fullUser.user.firstName || "",
        lastName: fullUser.user.lastName || "",
        phone: fullUser.user.phone || "",
        role: fullUser.user.role || "user",
        firstLoginShown: fullUser.user.firstLoginShown || false, // important!
      });

      // 4️⃣ Success message
      setStatus({
        type: "success",
        message: "Login successful! Redirecting...",
      });

      // 5️⃣ Redirect based on role
      setTimeout(() => {
        if (fullUser.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard"); // first-login popup handled by dashboard
        }
      }, 1200);
    } catch (err) {
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
              validate();
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
              validate();
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
