"use client"
import { Trash2 } from 'lucide-react';
import { Input } from './ui/Input';
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ResumeFormData } from '@/models/resume';

type EducationSectionProps = {
    index: number;
    register: UseFormRegister<ResumeFormData>;
    remove: (index: number) => void;
    canRemove: boolean;
    errors: FieldErrors<ResumeFormData>;
  };

export default function EducationSection({ index, register, remove, canRemove, errors }: EducationSectionProps) {
    return (
      <div className="mb-4 p-6 border-2 border-gray-200 rounded-lg relative">
        {canRemove && (
          <button
            type="button"
            onClick={() => remove(index)}
            className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
            <Input
              {...register(`education.${index}.school`, { required: "School is required" })}
              placeholder="Stanford University"
            />
            {errors.education?.[index]?.school && (
              <p className="text-red-500 text-xs mt-1">{errors.education[index].school.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
            <Input
              {...register(`education.${index}.degree`, { required: "Degree is required" })}
              placeholder="Bachelor of Science"
            />
            {errors.education?.[index]?.degree && (
              <p className="text-red-500 text-xs mt-1">{errors.education[index].degree.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
            <Input
              {...register(`education.${index}.major`)}
              placeholder="Computer Science"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Date</label>
            <Input
              {...register(`education.${index}.graduationDate`)}
              type="month"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GPA (Optional)</label>
            <Input
              {...register(`education.${index}.gpa`)}
              placeholder="3.8"
            />
          </div>
        </div>
      </div>
    );
  }