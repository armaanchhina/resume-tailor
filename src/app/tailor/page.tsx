"use client"

import { useEffect, useState } from "react"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Sparkles } from "lucide-react";
import { dummyData } from "../lib/prompt";
import { LatexResumeData, TailoredResume } from "@/models/resume";


export default function TailorePage() {
    const [loading, setLoading] = useState(true)
    const [tailored, setTailored] = useState<any>(null)
    const [error, setError] = useState("")

    useEffect(() => {
        const job = localStorage.getItem("JOB_DESCRIPTION")
        if (!job){
            setError("No job description found")
            setLoading(false)
            return
        }

        const tailor = async () => {
            try {
                const res = await fetch("/api/tailor", {
                    method: "POST",
                    headers: { "Content-Type": "application/json"},
                    credentials: "include",
                    body: JSON.stringify({jobDescription: job})
                })

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Something went wrong")
                } else {
                    setTailored(data.tailored)
                }
                // setTailored(dummyData)
            } catch (err) {
                setError("Failed to tailor resume")
            } finally {
                setLoading(false)
            }
        }

        tailor()
    }, [])

    const generatePDF = async (tailoredJson: TailoredResume) => {
      const res = await fetch("/api/pdf", {
        method: "POST",
        body: JSON.stringify(tailoredJson)
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "tailored_resume.pdf";
      a.click();
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
        )
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
                  <h3 className="font-semibold text-lg mb-2">Professional Summary</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {tailored.summary}
                  </p>
                </section>
              )}

    
              {/* Work Experience */}
              <section className="mb-8">
                <h3 className="font-semibold text-lg mb-4">Work Experience</h3>
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
                <h3 className="font-semibold text-lg mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {tailored.skills.map((skill: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
    
              {/* Download Buttons */}
              <div className="flex gap-3 pt-6 border-t">
                <button className="px-6 py-3 bg-gray-200 rounded-lg font-medium hover:bg-gray-300">
                  Copy JSON
                </button>
                <button
                  onClick={() => generatePDF(tailored)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </main>
    
          <Footer />
        </div>
      );
}