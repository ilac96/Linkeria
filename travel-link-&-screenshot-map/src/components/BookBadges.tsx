import React from "react";

// Circular Italian Flag badge matching the design in user's screenshots
export function ItalianFlagBadge({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full overflow-hidden border-[1.5px] border-slate-900 shadow-sm shrink-0 flex relative bg-white`}>
      <div className="w-1/3 h-full bg-[#008c45]" />
      <div className="w-1/3 h-full bg-white" />
      <div className="w-1/3 h-full bg-[#cd212a]" />
    </div>
  );
}

// Circular International World Globe badge matching the design in user's screenshots (red continents on white background with black outline)
export function WorldGlobeBadge({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full overflow-hidden border-[1.5px] border-slate-900 shadow-sm shrink-0 flex items-center justify-center relative bg-white`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#ffffff" />
        
        {/* Americas */}
        <path
          d="M22 28 C26 24, 34 26, 36 32 C38 38, 30 46, 26 48 C24 49, 23 54, 25 58 C27 62, 33 66, 32 72 C31 78, 25 84, 22 80 C20 76, 22 70, 20 64 C18 58, 14 50, 16 42 C18 36, 18 32, 22 28 Z"
          fill="#d64b38"
          stroke="#1e293b"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Greenland / North islands */}
        <path
          d="M34 16 C38 14, 44 16, 42 22 C40 26, 32 24, 34 16 Z"
          fill="#d64b38"
          stroke="#1e293b"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Europe / Asia */}
        <path
          d="M52 24 C56 20, 68 20, 74 24 C80 28, 86 32, 88 40 C89 48, 84 54, 80 56 C76 58, 70 54, 66 50 C62 46, 64 40, 58 38 C54 36, 50 32, 52 24 Z"
          fill="#d64b38"
          stroke="#1e293b"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Africa */}
        <path
          d="M54 44 C60 42, 68 46, 68 54 C68 62, 64 72, 60 76 C56 80, 52 76, 50 70 C48 64, 50 56, 52 50 C53 47, 51 45, 54 44 Z"
          fill="#d64b38"
          stroke="#1e293b"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Australia / East Indies */}
        <path
          d="M76 66 C82 64, 88 68, 86 74 C84 80, 76 80, 74 76 C72 72, 74 68, 76 66 Z"
          fill="#d64b38"
          stroke="#1e293b"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="50" r="48" stroke="#1e293b" strokeWidth="2.5" />
      </svg>
    </div>
  );
}
