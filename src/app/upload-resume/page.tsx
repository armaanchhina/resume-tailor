"use client"
import { useState } from 'react';
import { Upload, FileText, Check, Plus, Trash2, Briefcase, GraduationCap, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useForm, useFieldArray } from 'react-hook-form';
import WorkExperienceSection from '../components/WorkExperienceSection';
import EducationSection from '../components/EducationSection';
import { ResumeFormData, defaultResumeValues } from '@/models/resume';
import { Input } from '../components/ui/Input';
// This would be: app/upload-resume/page.tsx

export default function UploadResumePage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ResumeFormData>({
        defaultValues: defaultResumeValues,
    });

    // Field arrays for dynamic sections
    const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({
    control,
    name: "workExperience"
    });

    const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: "education"
    });

    const onSubmit = (data: ResumeFormData) => {
        console.log("Resume data:", data);
        alert("Resume saved!");
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
        <Header/>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          
          {/* Personal Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-6 h-6 text-indigo-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <Input
                  {...register("personalInfo.fullName", { required: "Name is required" })}
                  placeholder="John Doe"
                />
                {errors.personalInfo?.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.fullName.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input
                  {...register("personalInfo.email", { 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  type="email"
                  placeholder="john@example.com"
                />
                {errors.personalInfo?.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  {...register("personalInfo.phone")}
                  type="tel"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <Input
                  {...register("personalInfo.linkedin")}
                  type="url"
                  placeholder="linkedin.com/in/johndoe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                <Input
                  {...register("personalInfo.github")}
                  type="url"
                  placeholder="github.com/johndoe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                <Input
                  {...register("personalInfo.portfolio")}
                  type="url"
                  placeholder="johndoe.com"
                />
              </div>
            </div>
          </section>

          {/* Professional Summary */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Professional Summary</h2>
            <textarea
              {...register("summary")}
              placeholder="Brief overview of your experience and skills..."
              className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none resize-none"
            />
          </section>

          {/* Work Experience Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-indigo-600" />
                Work Experience *
              </h2>
              <button
                type="button"
                onClick={() => appendWork({
                  company: '',
                  position: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  current: false,
                  responsibilities: ['']
                })}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Experience
              </button>
            </div>

            {workFields.map((field, index) => (
              <WorkExperienceSection
                key={field.id}
                index={index}
                register={register}
                control={control}
                remove={removeWork}
                canRemove={workFields.length > 1}
                errors={errors}
                watch={watch}
              />
            ))}
          </section>

          {/* Education Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
                Education *
              </h2>
              <button
                type="button"
                onClick={() => appendEdu({
                  school: '',
                  degree: '',
                  major: '',
                  graduationDate: '',
                  gpa: ''
                })}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Education
              </button>
            </div>

            {eduFields.map((field, index) => (
              <EducationSection
                key={field.id}
                index={index}
                register={register}
                remove={removeEdu}
                canRemove={eduFields.length > 1}
                errors={errors}
              />
            ))}
          </section>

          {/* Skills */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-600" />
              Skills
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technical Skills (comma separated)
              </label>
              <Input
                {...register("skills.technical")}
                placeholder="React, Node.js, Python, AWS, Docker"
              />
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Resume
                </>
              )}
            </button>
          </div>
        </div>
      </main>


      {/* Footer */}
      <Footer/>
    </div>
  );
}