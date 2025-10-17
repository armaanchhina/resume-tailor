// src/components/ui/Input.tsx
import React from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full px-4 py-2 border border-gray-300 rounded-lg",
        "focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none placeholder-gray-400 text-gray-800",
        className // allows custom overrides
      )}
    />
  );
}
