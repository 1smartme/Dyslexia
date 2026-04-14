import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Admin login failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/admin/dashboard");
    } catch (_err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
        <p className="text-sm text-gray-600 mb-6">Access platform analytics and governance tools.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input name="email" type="email" placeholder="Admin Email" className="w-full p-3 border rounded-lg" onChange={onChange} required />
          <input name="password" type="password" placeholder="Password" className="w-full p-3 border rounded-lg" onChange={onChange} required />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button disabled={loading} className="btn btn-primary w-full">
            {loading ? "Signing in..." : "Sign In as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
