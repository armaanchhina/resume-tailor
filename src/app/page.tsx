"use client"
import { useRouter } from 'next/navigation';
import { FileText, Upload, Sparkles, Briefcase, Edit2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { useAuth } from './lib/useAuth';
// This is: app/page.tsx (Home Page)

export default function Home() {
  const router = useRouter();
  const {currentUser, authLoading} = useAuth()
  const [hasResume, setHasResume] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    checkForResume();
  }, [currentUser, authLoading]);

  const checkForResume = async () => {
    setIsLoading(true);

    if (!currentUser){
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/resume", {
        method: "GET",
        credentials: "include"
      });
  
      const json = await res.json();
  
      if (!json.ok) {
        console.log("No resume yet.");
        setHasResume(false);
        return;
      }
  
      setHasResume(json.hasResume);
  
    } catch (err) {
      console.error("Error fetching resume:", err);
      setHasResume(false);
    } finally {
      setIsLoading(false); 
    }  
  };

  const handleUploadResume = () => {
    router.push(currentUser ? "/upload-resume" : "/sign-in");
  };

  const handleTailorResume = () => {
    router.push('/tailor');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <Header/>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Tailor Your Resume with AI
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {hasResume 
              ? "Your resume is ready. Paste a job description to tailor it instantly."
              : "Upload your resume once, then customize it for every job application using AI-powered optimization."
            }
          </p>
        </div>

        {/* NO RESUME - Get Started */}
        {!hasResume && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Get Started
              </h3>
              <p className="text-gray-600 mb-8">
                First, upload your master resume. Then you can tailor it to any job description in seconds.
              </p>
              <button
                onClick={handleUploadResume}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
              >
                Upload Your Resume →
              </button>
            </div>
          </div>
        )}

        {/* HAS RESUME - Tailor Section */}
        {hasResume && (
          <div className="max-w-3xl mx-auto">
            {/* Tailor Resume Card */}
            <div className="bg-white rounded-2xl shadow-xl p-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                Tailor Your Resume
              </h3>
              <p className="text-gray-600 mb-6 text-center">
                Paste a job description below and we'll optimize your resume for that position.
              </p>

              <textarea
                placeholder="Paste job description here...&#10;&#10;Example:&#10;We're looking for a Senior Full Stack Developer with:&#10;• 5+ years experience with React and Node.js&#10;• Strong knowledge of AWS and cloud infrastructure&#10;• Experience with microservices architecture..."
                className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none resize-none text-sm mb-4 placeholder-gray-400 text-gray-800"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleUploadResume}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Resume
                </button>
                <button
                  onClick={handleTailorResume}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Tailor Resume
                </button>
              </div>
            </div>

            {/* Recent Tailored Resumes */}
            <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Recent Tailored Resumes</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-900">Senior Software Engineer</p>
                      <p className="text-sm text-gray-500">Google • 2 days ago</p>
                    </div>
                  </div>
                  <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    Download
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-900">Full Stack Developer</p>
                      <p className="text-sm text-gray-500">Microsoft • 5 days ago</p>
                    </div>
                  </div>
                  <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Upload Once</h4>
            <p className="text-sm text-gray-600">
              Save your master resume and reuse it for multiple applications
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">AI Tailoring</h4>
            <p className="text-sm text-gray-600">
              Automatically optimize your resume for each job description
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Professional PDF</h4>
            <p className="text-sm text-gray-600">
              Download beautifully formatted resumes in LaTeX style
            </p>
          </div>
        </div>
      </main>

      <Footer/>
    </div>
  );
}
