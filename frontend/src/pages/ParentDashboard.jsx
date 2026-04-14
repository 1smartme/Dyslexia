import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, LineChart } from "../components/ui/Charts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch(`${API_URL}/api/parent/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to load parent dashboard");
          return;
        }
        setChildren(data.children || []);
        if (data.children?.length) setSelectedChildId(data.children[0].id);
      } catch (_err) {
        setError("Could not load dashboard data.");
      }
    };
    if (token) loadDashboard();
  }, [token]);

  useEffect(() => {
    const loadStudentResult = async () => {
      if (!selectedChildId) return;
      try {
        const res = await fetch(`${API_URL}/api/parent/student/${selectedChildId}/results`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to load child progress");
          return;
        }
        setSelectedResult(data);
      } catch (_err) {
        setError("Could not load child progress.");
      }
    };
    if (token) loadStudentResult();
  }, [selectedChildId, token]);

  const scoreTrend = useMemo(() => {
    const rows = selectedResult?.results || [];
    const normalized = rows.slice(0, 7).reverse().map((item, idx) => ({
      label: `G${idx + 1}`,
      value: Number(item.score || 0),
    }));
    return normalized.length > 1 ? normalized : [{ label: "G1", value: 0 }, { label: "G2", value: 0 }];
  }, [selectedResult]);

  const childrenBars = useMemo(
    () =>
      children.map((child) => ({
        label: child.name,
        value: Math.round(Number(child.analytics?.average_score || 0)),
        color: "bg-blue-500",
      })),
    [children]
  );

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <div className="flex gap-2">
            <Link to="/games" className="btn btn-outline">Student View</Link>
            <Link to="/parent/login" className="btn btn-ghost">Switch Account</Link>
          </div>
        </div>

        {error ? <p className="text-red-600 mb-4">{error}</p> : null}

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="card p-4">
            <h2 className="font-semibold mb-3">Children</h2>
            <div className="space-y-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`w-full text-left p-3 rounded border ${selectedChildId === child.id ? "border-primary-500 bg-primary-50" : "border-gray-200"}`}
                >
                  <p className="font-medium">{child.name}</p>
                  <p className="text-xs text-gray-500">{child.email}</p>
                </button>
              ))}
              {!children.length ? <p className="text-sm text-gray-500">No linked students yet.</p> : null}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="card p-4">
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-bold">{selectedResult?.analytics?.average_score ?? 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">Games Played</p>
                <p className="text-2xl font-bold">{selectedResult?.analytics?.total_games_played ?? 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">Last Activity</p>
                <p className="text-sm font-semibold">{selectedResult?.analytics?.last_activity ? new Date(selectedResult.analytics.last_activity).toLocaleString() : "N/A"}</p>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold mb-4">Children Average Score</h3>
              {childrenBars.length ? <BarChart data={childrenBars} /> : <p className="text-sm text-gray-500">No data yet.</p>}
            </div>

            <div className="card p-4">
              <h3 className="font-semibold mb-4">Selected Child Progress Trend</h3>
              <LineChart data={scoreTrend} color="#10B981" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
