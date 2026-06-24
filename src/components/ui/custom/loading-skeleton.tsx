interface LoadingSkeletonProps {
  rows?: number;
}

export function LoadingSkeleton({ rows = 3 }: LoadingSkeletonProps) {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 animate-pulse p-4 border rounded-lg bg-card">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-[30%]"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-[20%]"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}
