"use client";
import { useEffect, useState, Suspense } from "react";
import {
  Upload,
  Check,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useForm, useFieldArray } from "react-hook-form";
import WorkExperienceSection from "../components/WorkExperienceSection";
import EducationSection from "../components/EducationSection";
import ProjectsSection from "../components/ProjectsSection";
import { ResumeFormData, defaultResumeValues } from "@/models/resume";
import { Input } from "../components/ui/Input";
import { useRequireAuth } from "../lib/useRequireAuth";

type ResumeSummary = { id: string; name: string };

const SUMMARY_WORD_LIMIT = 60;
const ADDITIONAL_INFO_WORD_LIMIT = 150;

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function wordLimitValidator(max: number) {
  return (value: string) =>
    countWords(value || "") <= max || `Keep it under ${max} words`;
}

function toFormValues(resume: any): ResumeFormData {
  return {
    resumeName: resume.name || "My Resume",
    personalInfo: {
      fullName: resume.fullName,
      email: resume.email,
      phone: resume.phone || "",
      linkedin: resume.linkedin || "",
      github: resume.github || "",
      portfolio: resume.portfolio || "",
    },
    summary: resume.summary || "",
    additionalInfo: resume.additionalInfo || "",
    workExperience: resume.workJson || [],
    education: resume.educationJson || [],
    projects: resume.projectsJson?.length
      ? resume.projectsJson
      : structuredClone(defaultResumeValues.projects),
    skills: {
      technical: (resume.technicalSkillsJson ?? []).map((s: any) => ({
        category: s.category ?? "",
        items: Array.isArray(s.items) ? s.items.join(", ") : s.items ?? "",
      })),
    },
  };
}

export default function UploadResumePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <UploadResumePageContent />
    </Suspense>
  );
}

function UploadResumePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const isNew = searchParams.get("new") === "1";
  const { currentUser, authLoading } = useRequireAuth();

  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [target, setTarget] = useState<{ id: string | null; values: ResumeFormData } | null>(null);

  useEffect(() => {
    if (authLoading || !currentUser) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/resume", { credentials: "include" });
        if (!res.ok) return;

        const { resumes: list } = await res.json();
        if (cancelled) return;
        setResumes(list ?? []);

        // No ?id given and not explicitly starting fresh -> default to the
        // most recently updated resume, so links like "Edit Resume" that
        // don't know a specific id still land somewhere useful.
        const resume = idParam
          ? list?.find((r: any) => r.id === idParam) ?? null
          : isNew
          ? null
          : list?.[0] ?? null;

        setTarget({
          id: resume?.id ?? null,
          values: resume ? toFormValues(resume) : structuredClone(defaultResumeValues),
        });
      } catch (err) {
        console.error("Failed to load resumes:", err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [idParam, isNew, authLoading, currentUser]);

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-4xl mx-auto px-6 pt-12">
        {resumes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-500 mr-1">Your resumes:</span>
            {resumes.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => router.push(`/upload-resume?id=${r.id}`)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  r.id === target?.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {r.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => router.push("/upload-resume?new=1")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition flex items-center gap-1 ${
                target && !target.id
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              New Resume
            </button>
          </div>
        )}
      </div>

      {target ? (
        <ResumeForm
          key={target.id ?? "new"}
          resumeId={target.id}
          initialValues={target.values}
        />
      ) : (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <Footer />
    </div>
  );
}

function ResumeForm({
  resumeId,
  initialValues,
}: {
  resumeId: string | null;
  initialValues: ResumeFormData;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResumeFormData>({
    defaultValues: initialValues,
  });

  // Field arrays for dynamic sections
  const {
    fields: workFields,
    append: appendWork,
    remove: removeWork,
  } = useFieldArray({
    control,
    name: "workExperience",
  });

  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
  } = useFieldArray({
    control,
    name: "education",
  });

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
  } = useFieldArray({
    control,
    name: "projects",
  });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    name: "skills.technical",
  });

  const onSubmit = async (data: ResumeFormData) => {
    setIsSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, id: resumeId || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || `Request failed with ${res.status}`);
      }

      router.push("/");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!resumeId) return;
    if (!window.confirm("Delete this resume? This can't be undone.")) return;

    setIsDeleting(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/resume?id=${resumeId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to delete resume");
      }

      router.push("/");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to delete resume");
      setIsDeleting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-4xl mx-auto px-6 pb-12"
    >
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Resume Name */}
        <section className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resume Name *
          </label>
          <Input
            {...register("resumeName", { required: "Give this resume a name" })}
            placeholder="e.g. General SWE, Bioinformatics SWE"
          />
          {errors.resumeName && (
            <p className="text-red-500 text-xs mt-1">{errors.resumeName.message}</p>
          )}
        </section>

        {/* Personal Information */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6 text-indigo-600" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <Input
                {...register("personalInfo.fullName", {
                  required: "Name is required",
                })}
                placeholder="John Doe"
              />
              {errors.personalInfo?.fullName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.personalInfo.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                {...register("personalInfo.email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                type="email"
                placeholder="john@example.com"
              />
              {errors.personalInfo?.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.personalInfo.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input
                {...register("personalInfo.phone")}
                type="tel"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              <Input
                {...register("personalInfo.linkedin")}
                type="url"
                placeholder="linkedin.com/in/johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub
              </label>
              <Input
                {...register("personalInfo.github")}
                type="url"
                placeholder="github.com/johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portfolio
              </label>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Professional Summary
          </h2>
          <textarea
            {...register("summary", { validate: wordLimitValidator(SUMMARY_WORD_LIMIT) })}
            placeholder="Brief overview of your experience and skills..."
            className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none resize-none text-gray-800 placeholder-gray-400"
          />
          <div className="flex items-center justify-between mt-1">
            {errors.summary ? (
              <p className="text-red-500 text-xs">{errors.summary.message}</p>
            ) : (
              <span />
            )}
            <p
              className={`text-xs ${
                countWords(watch("summary") || "") > SUMMARY_WORD_LIMIT
                  ? "text-red-500"
                  : "text-gray-400"
              }`}
            >
              {countWords(watch("summary") || "")}/{SUMMARY_WORD_LIMIT} words
            </p>
          </div>
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
              onClick={() =>
                appendWork({
                  company: "",
                  position: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                  current: false,
                  responsibilities: [""],
                })
              }
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
              onClick={() =>
                appendEdu({
                  school: "",
                  degree: "",
                  major: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                  gpa: "",
                })
              }
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

        {/* Projects Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FolderGit2 className="w-6 h-6 text-indigo-600" />
              Projects
            </h2>
            <button
              type="button"
              onClick={() =>
                appendProject({
                  title: "",
                  tech: "",
                  link: "",
                  startDate: "",
                  endDate: "",
                  current: false,
                  bullets: [""],
                })
              }
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          </div>

          {projectFields.length === 0 && (
            <p className="text-sm text-gray-500">
              Optional — add side projects, open source work, or anything worth showing off.
            </p>
          )}

          {projectFields.map((field, index) => (
            <ProjectsSection
              key={field.id}
              index={index}
              register={register}
              control={control}
              remove={removeProject}
              canRemove={projectFields.length >= 1}
              errors={errors}
              watch={watch}
            />
          ))}
        </section>

        {/* Skills */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" />
            Skills
          </h2>

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              Add categories like Languages, Frontend, Backend, etc.
            </p>
            <button
              type="button"
              onClick={() => appendSkill({ category: "", items: "" })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          <div className="space-y-3">
            {skillFields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <Input
                    {...register(
                      `skills.technical.${index}.category` as const,
                      { required: true }
                    )}
                    placeholder="Languages"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Items (comma separated)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      {...register(
                        `skills.technical.${index}.items` as const
                      )}
                      placeholder="Python, TypeScript, Java, SQL"
                    />
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      disabled={skillFields.length <= 1}
                      className="px-3 py-2 border rounded-lg text-gray-600 hover:text-gray-900 disabled:opacity-40"
                      title="Remove category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Info */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Anything else? (optional)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Side projects, achievements, or specific tech you've used that didn't fit
            above — we'll draw on this when a job posting calls for it.
          </p>
          <textarea
            {...register("additionalInfo", {
              validate: wordLimitValidator(ADDITIONAL_INFO_WORD_LIMIT),
            })}
            placeholder="e.g. Built a Kafka-based pipeline over a weekend, handled ~10k events/min. Not on the resume above, but worth mentioning if a job asks for event-driven experience."
            className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none resize-none text-gray-800 placeholder-gray-400"
          />
          <div className="flex items-center justify-between mt-1">
            {errors.additionalInfo ? (
              <p className="text-red-500 text-xs">{errors.additionalInfo.message}</p>
            ) : (
              <span />
            )}
            <p
              className={`text-xs ${
                countWords(watch("additionalInfo") || "") > ADDITIONAL_INFO_WORD_LIMIT
                  ? "text-red-500"
                  : "text-gray-400"
              }`}
            >
              {countWords(watch("additionalInfo") || "")}/{ADDITIONAL_INFO_WORD_LIMIT} words
            </p>
          </div>
        </section>

        {saveError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition"
          >
            Cancel
          </button>
          {resumeId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-6 py-3 text-red-600 hover:text-red-800 font-medium transition disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
          <button
            type="submit"
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
    </form>
  );
}
