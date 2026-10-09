"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

// Types
interface ConfirmConfig {
  show: boolean;
  title: string;
  msg: string;
  onConfirm: (() => void) | null;
}

interface ConfirmContextType {
  askConfirm: (title: string, msg: string, callback: () => void) => void;
}

//createـ Context
const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

interface ConfirmProviderProps {
  children: ReactNode;
}

export const ConfirmProvider: React.FC<ConfirmProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<ConfirmConfig>({
    show: false,
    title: "",
    msg: "",
    onConfirm: null,
  });

  const closeConfirm = () => {
    setConfig((prev) => ({ ...prev, show: false }));
  };

  const askConfirm = (title: string, msg: string, callback: () => void) => {
    setConfig({
      show: true,
      title,
      msg,
      onConfirm: () => {
        callback();
        closeConfirm(); 
      },
    });
  };

  return (
    <ConfirmContext.Provider value={{ askConfirm }}>
      {children}
      {/* Confirmation window (Modal UI)*/}
      <div
        className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-300 ${
          config.show ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Background blurring */} 
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeConfirm}
        />

        {/* Window Body */} 
        <div dir="rtl"
          className={`relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 transition-all duration-300 transform ${
            config.show ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {config.title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
            {config.msg}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeConfirm}
              className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-white dark:text-gray-200 text-sm"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => config.onConfirm && config.onConfirm()}
              className="flex-1 py-3 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white transition-opacity shadow-lg shadow-red-500/20 text-sm"
            >
              تأكيد
            </button>
          </div>
        </div>
      </div>
    </ConfirmContext.Provider>
  );
};
// False summons 
export const useConfirm = (): ConfirmContextType => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};

export default ConfirmContext;
