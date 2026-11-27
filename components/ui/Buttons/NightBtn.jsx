import React from "react";

interface NightBtnProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NightBtn = ({ checked, onChange }: NightBtnProps) => {
  return (
    <label
      dir="ltr"
      title={checked ? "الوضع الليلي" : "الوضع النهاري"}
      className="relative inline-block h-6 w-11 shrink-0 cursor-pointer"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label="تبديل الوضع الليلي"
        className="peer sr-only"
      />

      {/* Track + knob */}
      <span
        className="absolute inset-0 rounded-full bg-[#73c0fc] transition-colors duration-[400ms]
          before:absolute before:bottom-0.5 before:left-0.5 before:z-[2] before:h-5 before:w-5
          before:rounded-full before:bg-[#e8e8e8] before:transition-transform before:duration-[400ms] before:content-['']
          peer-checked:bg-[#183153] peer-checked:before:translate-x-5
          peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#73c0fc]"
      />

      {/* Sun */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="pointer-events-none absolute left-6 top-1 z-[1] h-4 w-4 animate-[spin_15s_linear_infinite]"
      >
        <g fill="#ffd43b">
          <circle r="5" cy="12" cx="12" />
          <path d="m21 13h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm-17 0h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm13.66-5.66a1 1 0 0 1 -.66-.29 1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1 -.75.29zm-12.02 12.02a1 1 0 0 1 -.71-.29 1 1 0 0 1 0-1.41l.71-.66a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1 -.7.24zm6.36-14.36a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm0 17a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm-5.66-14.66a1 1 0 0 1 -.7-.29l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.29zm12.02 12.02a1 1 0 0 1 -.7-.29l-.66-.71a1 1 0 0 1 1.36-1.36l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.24z" />
        </g>
      </svg>

      {/* Moon (tilting animation defined inline, no external CSS needed) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 384 512"
        aria-hidden="true"
        className="pointer-events-none absolute left-1 top-1 z-[1] h-4 w-4 fill-[#73c0fc]"
        style={{ animation: "night-tilt 5s linear infinite" }}
      >
        <path d="m223.5 32c-123.5 0-223.5 100.3-223.5 224s100 224 223.5 224c60.6 0 115.5-24.2 155.8-63.4 5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6-96.9 0-175.5-78.8-175.5-176 0-65.8 36-123.1 89.3-153.3 6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z" />
      </svg>

      <style>{`
        @keyframes night-tilt {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
      `}</style>
    </label>
  );
};

export default NightBtn;