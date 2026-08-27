"use client";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "./ui/Input";

// react-hook-form's ArrayPath type can't express a dynamic nested path like
// `projects.${index}.bullets`, so this mirrors WorkExperienceSection and stays untyped.
export default function ProjectsSection({ index, register, control, remove, canRemove, errors, watch }) {
  const { fields, append, remove: removeBullet } = useFieldArray({
    control,
    name: `projects.${index}.bullets`,
  });

  const currentValue = watch(`projects.${index}.current`);

  return (
    <div className="mb-6 p-6 border-2 border-gray-200 rounded-lg relative">
      {canRemove && (
        <button
          type="button"
          onClick={() => remove(index)}
          className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
          <Input
            {...register(`projects.${index}.title`, {
              required: "Project name is required",
            })}
            placeholder="Resume Tailor"
          />
          {errors.projects?.[index]?.title && (
            <p className="text-red-500 text-xs mt-1">{errors.projects[index]?.title?.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack</label>
          <Input
            {...register(`projects.${index}.tech`)}
            placeholder="Next.js, TypeScript, Postgres"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
          <Input
            {...register(`projects.${index}.link`)}
            type="url"
            placeholder="github.com/you/project"
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              {...register(`projects.${index}.current`)}
              type="checkbox"
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-200"
            />
            <span className="text-sm text-gray-700">Still working on this</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <Input {...register(`projects.${index}.startDate`)} type="month" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            {...register(`projects.${index}.endDate`)}
            type="month"
            disabled={currentValue}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none text-gray-700 disabled:bg-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Highlights *</label>
        {fields.map((field, bulletIndex) => (
          <div key={field.id} className="flex gap-2 mb-2">
            <Input
              {...register(`projects.${index}.bullets.${bulletIndex}`, {
                required: "Highlight is required",
              })}
              placeholder="Built a REST API that..."
            />
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => removeBullet(bulletIndex)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => append("")}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 mt-2"
        >
          <Plus className="w-4 h-4" />
          Add highlight
        </button>
      </div>
    </div>
  );
}
