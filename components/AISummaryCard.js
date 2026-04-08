"use client";

import { useState } from "react";

export default function AISummaryCard({ data }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    try {
      setLoading(true);
      setError("");
      setSummary("");

      const res = await fetch("/api/insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to generate insight");
      }

      setSummary(result.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">AI Summary</h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate a short interpretation of the recent mNAV trend
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Insight"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
          {error}
        </p>
      )}

      {!error && !summary && !loading && (
        <p className="text-slate-600 leading-7">
          Click the button to generate an AI-assisted summary based on the latest
          30-day mNAV data.
        </p>
      )}

      {summary && (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-slate-700 leading-7 whitespace-pre-line">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}