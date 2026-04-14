import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart } from "../components/ui/Charts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const fetchAll = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [dashRes, studentsRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/dashboard`, { headers }),
        fetch(`${API_URL}/api/admin/students`, { headers }),
        fetch(`${API_URL}/api/admin/analytics`, { headers }),
      ]);

      const [dashData, studentsData, analyticsData] = await Promise.all([
        dashRes.json(),
        studentsRes.json(),
        analyticsRes.json(),
      ]);

      if (!dashRes.ok || !studentsRes.ok || !analyticsRes.ok) {
        setError(dashData.message || studentsData.message || analyticsData.message || "Failed to load admin data");
        return;
      }

      setStats(dashData.stats);
      setStudents(studentsData.students || []);
      setAnalytics(analyticsData);
    } catch (_err) {
      setError("Network error while loading admin dashboard.");
    }
  };

  useEffect(() => {
    if (token) fetchAll();
  }, [token]);

  const deleteStudent = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/student/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Delete failed");
        return;
      }
      await fetchAll();
    } catch (_err) {
      setError("Delete request failed");
    }
  };

  const analyticsBars = useMemo(
    () =>
      analytics
        ? [
            { label: "Students", value: Number(analytics.total_students || 0), color: "bg-blue-500" },
            { label: "Parents", value: Number(analytics.total_parents || 0), color: "bg-indigo-500" },
            { label: "Games", value: Number(analytics.total_games_played || 0), color: "bg-emerald-500" },
          ]
        : [],
    [analytics]
  );

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="btn btn-outline">Refresh</button>
            <Link to="/admin/login" className="btn btn-ghost">Switch Account</Link>
          </div>
        </div>

        {error ? <p className="text-red-600 mb-4">{error}</p> : null}

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-sm text-gray-500">Total Students</p><p className="text-2xl font-bold">{stats?.total_students ?? 0}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">Total Parents</p><p className="text-2xl font-bold">{stats?.total_parents ?? 0}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">Avg Score</p><p className="text-2xl font-bold">{Number(stats?.avg_score || 0).toFixed(2)}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">Games Played</p><p className="text-2xl font-bold">{stats?.total_games_played ?? 0}</p></div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-4">
            <h2 className="font-semibold mb-4">Students</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b">
                      <td className="py-2">{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.created_at ? new Date(student.created_at).toLocaleDateString() : "-"}</td>
                      <td>
                        <button onClick={() => deleteStudent(student.id)} className="btn btn-ghost text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {!students.length ? (
                    <tr><td className="py-3 text-gray-500" colSpan={4}>No students found.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="font-semibold mb-4">Platform Analytics</h2>
            {analyticsBars.length ? <BarChart data={analyticsBars} /> : <p className="text-sm text-gray-500">No analytics available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
