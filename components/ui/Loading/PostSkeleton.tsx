import React from 'react';

interface PostSkeletonProps {
  cardsCount?: number;
}

export const PostSkeleton: React.FC<PostSkeletonProps> = ({ cardsCount = 1 }) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto p-4">
      {Array.from({ length: cardsCount }).map((_, index) => (
        <div 
          key={index} 
          className="card bg-base-100 border border-base-200 shadow-sm p-4 rounded-xl flex flex-col gap-4 animate-pulse"
        >
          {/* header */}
          <div className="flex items-center gap-3">
            <div className="skeleton w-12 h-12 rounded-full shrink-0"></div>
            <div className="flex flex-col gap-2 w-full">
              <div className="skeleton h-4 w-1/3 rounded"></div>
              <div className="skeleton h-3 w-1/5 rounded"></div>
            </div>
          </div>

          {/* text */}
          <div className="flex flex-col gap-2">
            <div className="skeleton h-4 w-full rounded"></div>
            <div className="skeleton h-4 w-5/6 rounded"></div>
            <div className="skeleton h-4 w-2/3 rounded"></div>
          </div>

          {/* post img */}
          <div className="skeleton h-48 w-full rounded-lg"></div>

          {/*  Interaction buttons */}
          <div className="flex justify-between items-center pt-2 border-t border-base-200">
            <div className="skeleton h-8 w-20 rounded-lg"></div>
            <div className="skeleton h-8 w-20 rounded-lg"></div>
            <div className="skeleton h-8 w-20 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
