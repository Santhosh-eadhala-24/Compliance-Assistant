"use client";

import { Moon, Sun } from "lucide-react";
import { IconButton } from "./IconButton";

export function ThemeToggle() {
  function toggle() {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Theme still switches for this session.
    }
  }

  return (
    <IconButton label="Toggle theme" onClick={toggle}>
      <Moon size={18} className="dark:hidden" aria-hidden />
      <Sun size={18} className="hidden dark:block" aria-hidden />
    </IconButton>
  );
}
