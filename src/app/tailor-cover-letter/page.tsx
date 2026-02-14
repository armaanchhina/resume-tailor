"use client";

import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Sparkles } from "lucide-react";
import { TailoredResume } from "@/models/resume";
import { useRouter } from "next/navigation";

const MAX_REGENERATES = 3;

export default function TailorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [error, setError] = useState("");
  const [regenerateCount, setRegenerateCount] = useState(0);

  const tailor = async () => {
    if (regenerateCount >= MAX_REGENERATES) {
      return;
    }
    const job = localStorage.getItem("JOB_DESCRIPTION");
    if (!job) {
      setError("No job description found");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tailor-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobDescription: job }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setCoverLetter(data.coverLetter);
      setRegenerateCount((prev) => prev + 1);
    } catch (err) {
      setError("Failed to tailor cover letter");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    tailor();
  }, []);

  const generatePDF = async (coverLetter: string) => {
    const res = await fetch("/api/tailor-cover-letter/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter }),
    });

    if (!res.ok) throw new Error(await res.text());

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "cover_letter.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-3">Tailoring your cover letter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Tailored Resume
            </h2>
          </div>

          <section className="mb-8">
            <h3 className="font-semibold text-lg mb-2">Cover Letter</h3>
            <p className="text-gray-700 whitespace-pre-line">{coverLetter}</p>
          </section>

          <div className="flex flex-wrap gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-6 py-3 font-medium text-indigo-600 
    border border-indigo-200 rounded-lg 
    hover:bg-indigo-50 transition"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={() => generatePDF(coverLetter)}
              className="px-6 py-3 bg-indigo-600 text-white 
    rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Download PDF
            </button>

            <button
              type="button"
              onClick={tailor}
              disabled={loading || regenerateCount >= MAX_REGENERATES}
              className="flex items-center gap-2 px-6 py-3 
    bg-gradient-to-r from-purple-600 to-indigo-600 
    text-white font-semibold rounded-lg shadow-md
    hover:from-purple-700 hover:to-indigo-700
    transition disabled:opacity-50"
            >
              {regenerateCount >= MAX_REGENERATES
                ? "Limit reached"
                : loading
                ? "Regenerating..."
                : "Regenerate"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
