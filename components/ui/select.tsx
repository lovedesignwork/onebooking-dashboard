"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon } from "@/components/ui/icons";

interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedIndex = options.findIndex((opt) => opt.value === value);
      if (selectedIndex >= 0) {
        setHighlightedIndex(selectedIndex);
        const item = listRef.current.children[selectedIndex] as HTMLElement;
        if (item) {
          item.scrollIntoView({ block: "nearest" });
        }
      }
    }
  }, [isOpen, value, options]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          onChange(options[highlightedIndex].value);
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-3 
          bg-white border border-slate-200 rounded-xl
          text-left text-sm
          transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer hover:border-slate-300"}
          ${isOpen ? "border-[#1a237e] ring-2 ring-[#1a237e]/20" : ""}
        `}
      >
        <span className={selectedOption ? "text-slate-900" : "text-slate-400"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDownIcon
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          className="
            absolute z-50 w-full mt-2 py-2
            bg-white border border-slate-200 rounded-xl
            shadow-lg shadow-slate-200/50
            max-h-60 overflow-auto
            animate-in fade-in-0 zoom-in-95 duration-150
          "
          role="listbox"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`
                flex items-center justify-between gap-2 px-4 py-2.5 mx-2 rounded-lg
                cursor-pointer transition-colors duration-100
                ${highlightedIndex === index ? "bg-slate-100" : ""}
                ${option.value === value ? "text-[#1a237e] font-medium" : "text-slate-700"}
              `}
            >
              <div className="flex items-center gap-3">
                {option.color && (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span>{option.label}</span>
              </div>
              {option.value === value && (
                <CheckIcon className="w-4 h-4 text-[#1a237e] flex-shrink-0" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StatusSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const statusOptions: SelectOption[] = [
    { value: "pending", label: "Pending", color: "#f59e0b" },
    { value: "confirmed", label: "Confirmed", color: "#10b981" },
    { value: "completed", label: "Completed", color: "#3b82f6" },
    { value: "cancelled", label: "Cancelled", color: "#ef4444" },
    { value: "refunded", label: "Refunded", color: "#8b5cf6" },
    { value: "no_show", label: "No Show", color: "#f97316" },
  ];

  return (
    <Select
      value={value}
      onChange={onChange}
      options={statusOptions}
      placeholder="Select status"
      disabled={disabled}
    />
  );
}
