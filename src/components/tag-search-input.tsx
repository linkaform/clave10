"use client";
import React, { useState } from "react";
import { Search, X } from "lucide-react";

interface TagSearchInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const TagSearchInput = ({
  tags,
  onTagsChange,
  placeholder = "Buscar...",
  className = "",
}: TagSearchInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      const newTag = inputValue.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      setInputValue("");
      e.preventDefault();
    }
    if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="border rounded px-2 py-1 flex items-center gap-1 flex-wrap min-w-[200px] max-w-[500px] bg-white focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400 transition">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 hover:text-blue-200 transition"
              aria-label={`Eliminar filtro ${tag}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="outline-none text-sm flex-1 min-w-[80px] bg-transparent"
        />
      </div>
      <Search size={18} className="text-gray-400 shrink-0" />
    </div>
  );
};