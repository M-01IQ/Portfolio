import React from 'react';

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full gap-3 p-8">
      {/* Container with subtle glow */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse" />
        <span className="loading loading-spinner loading-lg text-primary relative z-10"></span>
      </div>
      
      {/* Loading Text */}
      <p className="text-sm font-medium text-base-content/70 animate-pulse tracking-wide">
        جاري التحميل...
      </p>
    </div>
  );
};

export default Loading;
