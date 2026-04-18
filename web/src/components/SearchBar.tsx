import type { ChangeEvent } from "react";

export interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
  /** Focus the input as soon as the landing screen mounts. */
  autoFocus?: boolean;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  autoFocus,
  placeholder = "Search lenses...",
}: SearchBarProps) {
  return (
    <input
      type="search"
      className="search-bar"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      autoComplete="off"
      spellCheck={false}
      aria-label="Search lenses"
    />
  );
}
