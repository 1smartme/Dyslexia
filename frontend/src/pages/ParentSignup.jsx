import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ParentSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/parent/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Parent signup failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/parent/dashboard");
    } catch (_err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-2">Parent Signup</h1>
        <p className="text-sm text-gray-600 mb-6">Create a secure parent account.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input name="name" type="text" placeholder="Full Name" className="w-full p-3 border rounded-lg" onChange={onChange} required />
          <input name="email" type="email" placeholder="Email" className="w-full p-3 border rounded-lg" onChange={onChange} required />
          <input name="password" type="password" placeholder="Password" className="w-full p-3 border rounded-lg" onChange={onChange} required />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button disabled={loading} className="btn btn-primary w-full">
            {loading ? "Creating account..." : "Create Parent Account"}
          </button>
        </form>
        <div className="mt-4 text-sm">
          Already registered? <Link className="text-primary-600" to="/parent/login">Login here</Link>
        </div>
      </div>
    </div>
  );
}
