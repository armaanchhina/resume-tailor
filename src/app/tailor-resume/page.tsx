"use client";

import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Sparkles } from "lucide-react";
import { TailoredResume } from "@/models/resume";
import { useRouter } from "next/navigation";

const MAX_REGENERATES = 3;

type Tab = "resume" | "cover";

export default function TailorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tailored, setTailored] = useState<any>(null);
  const [error, setError] = useState("");
  const [coverLetterBody, setCoverLetterBody] = useState<string>("");
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState("");
  const [tab, setTab] = useState<Tab>("resume");

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

  const generateCoverLetter = async () => {
    const job = localStorage.getItem("JOB_DESCRIPTION");
    if (!job) {
      setCoverLetterError("No job description found");
      return;
    }
    if (!tailored) {
      setCoverLetterError("No tailored resume found");
      return;
    }

    setCoverLetterLoading(true);
    setCoverLetterError("");

    try {
      const res = await fetch("/api/tailor-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobDescription: job,
          tailoredResume: tailored,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCoverLetterError(data.error || "Failed to generate cover letter");
        return;
      }

      setCoverLetterBody(data.coverLetter || "");
    } catch {
      setCoverLetterError("Failed to generate cover letter");
    } finally {
      setCoverLetterLoading(false);
    }
  };

  const downloadCoverLetterPDF = async () => {
    if (!coverLetterBody?.trim()) {
      setCoverLetterError("Generate the cover letter first");
      return;
    }

    const res = await fetch("/api/tailor-cover-letter/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ coverLetter: coverLetterBody }),
    });

    if (!res.ok) {
      setCoverLetterError("Failed to generate cover letter PDF");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "cover_letter.pdf";
    a.click();
    URL.revokeObjectURL(url);
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

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setTab("resume")}
              className={`px-4 py-2 rounded-lg font-semibold ${
                tab === "resume"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Resume
            </button>

            <button
              type="button"
              onClick={() => setTab("cover")}
              className={`px-4 py-2 rounded-lg font-semibold ${
                tab === "cover"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cover Letter
            </button>
          </div>

          {tab === "resume" && (
            <>
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
                <h3 className="font-semibold text-lg text-gray-800 mb-3">
                  Skills
                </h3>

                <div className="space-y-3">
                  {tailored?.skills?.technical?.map(
                    (group: any, idx: number) => (
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
                    )
                  )}
                </div>
              </section>
            </>
          )}

          {tab === "cover" && (
            <section className="mb-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    Cover Letter
                  </h3>
                  <p className="text-sm text-gray-500">
                    Generate, review, then download as a PDF.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <button
                    type="button"
                    onClick={generateCoverLetter}
                    disabled={coverLetterLoading || !tailored}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold
                     hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {coverLetterLoading
                      ? "Generating..."
                      : "Generate cover letter"}
                  </button>

                  <button
                    type="button"
                    onClick={downloadCoverLetterPDF}
                    disabled={!coverLetterBody?.trim()}
                    className="w-full sm:w-auto px-4 py-2 border border-indigo-200 text-indigo-600 rounded-lg font-semibold
                     hover:bg-indigo-50 transition disabled:opacity-50"
                  >
                    Download cover letter PDF
                  </button>
                </div>
              </div>

              {coverLetterError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-sm text-red-700">{coverLetterError}</p>
                </div>
              )}

              {coverLetterBody ? (
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                    <p className="text-sm font-medium text-gray-700">Preview</p>

                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(coverLetterBody)
                      }
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Copy
                    </button>
                  </div>

                  <div className="p-4 max-h-[420px] overflow-auto">
                    <pre className="whitespace-pre-wrap text-gray-800 text-sm font-sans leading-6">
                      {coverLetterBody}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border bg-gray-50 p-4">
                  <p className="text-gray-600 text-sm">
                    Click{" "}
                    <span className="font-semibold">Generate cover letter</span>{" "}
                    to create one based on your tailored resume and the job
                    description.
                  </p>
                </div>
              )}
            </section>
          )}

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
            {tab === "resume" && (
              <>
                <button
                  type="button"
                  onClick={() => generatePDF(tailored)}
                  className="px-6 py-3 bg-indigo-600 text-white 
    rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Download Resume PDF
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
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
