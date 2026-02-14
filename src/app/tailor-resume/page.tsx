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
  const [tailored, setTailored] = useState<any>(null);
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
      const res = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobDescription: job }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setTailored(data.tailored);
        setRegenerateCount((prev) => prev + 1);
      }
      // setTailored(dummyData)
    } catch (err) {
      setError("Failed to tailor resume");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    tailor();
  }, []);

  const generatePDF = async (tailoredJson: TailoredResume) => {
    const res = await fetch("/api/tailor-resume/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tailoredJson),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "tailored_resume.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-3">Tailoring your resume...</p>
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

          {/* Summary */}
          {tailored.summary && (
            <section className="mb-8">
              <h3 className="font-semibold text-lg mb-2">
                Professional Summary
              </h3>
              <p className="text-gray-700 whitespace-pre-line">
                {tailored.summary}
              </p>
            </section>
          )}

          {/* Work Experience */}
          <section className="mb-8">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">
              Work Experience
            </h3>
            {tailored.workExperience.map((job: any, idx: number) => (
              <div key={idx} className="mb-6">
                <p className="font-bold text-gray-900">
                  {job.position} — {job.company}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  {job.startDate} – {job.current ? "Present" : job.endDate}
                </p>
                <ul className="list-disc ml-6 text-gray-700 space-y-1">
                  {job.responsibilities.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* Skills */}
          <section className="mb-8">
            <h3 className="font-semibold text-lg text-gray-800 mb-3">Skills</h3>

            <div className="space-y-3">
              {tailored?.skills?.technical?.map((group: any, idx: number) => (
                <div key={idx}>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {group.category}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {group.items.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
              onClick={() => generatePDF(tailored)}
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
                : "Regenerate Bullet Points"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
