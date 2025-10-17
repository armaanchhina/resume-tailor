"use client"
import {useFieldArray } from 'react-hook-form';
import {Plus, Trash2} from 'lucide-react';
import { Input } from './ui/Input';


export default function WorkExperienceSection({ index, register, control, remove, canRemove, errors, watch }) {
    const { fields, append, remove: removeResp } = useFieldArray({
      control,
      name: `workExperience.${index}.responsibilities`
    });
  
    const currentValue = watch(`workExperience.${index}.current`);
  
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
            <Input
            {...register(`workExperience.${index}.company`, {
                required: "Company is required",
            })}
            placeholder="Google"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
            <Input
              {...register(`workExperience.${index}.position`, { required: "Position is required" })}
              placeholder="Senior Software Engineer"
            />
            {errors.workExperience?.[index]?.position && (
              <p className="text-red-500 text-xs mt-1">{errors.workExperience[index].position.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <Input
              {...register(`workExperience.${index}.location`)}
              placeholder="San Francisco, CA"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <Input
              {...register(`workExperience.${index}.startDate`)}
              type="month"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              {...register(`workExperience.${index}.endDate`)}
              type="month"
              disabled={currentValue}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none disabled:bg-gray-100"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                {...register(`workExperience.${index}.current`)}
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-200"
              />
              <span className="text-sm text-gray-700">Currently working here</span>
            </label>
          </div>
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities *</label>
          {fields.map((field, respIndex) => (
            <div key={field.id} className="flex gap-2 mb-2">
              <Input
                {...register(`workExperience.${index}.responsibilities.${respIndex}`, {
                  required: "Responsibility is required"
                })}
                placeholder="Led development of..."
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeResp(respIndex)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => append('')}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 mt-2"
          >
            <Plus className="w-4 h-4" />
            Add responsibility
          </button>
        </div>
      </div>
    );
  }