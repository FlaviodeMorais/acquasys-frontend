interface SimpleProgressProps {
  value: number;
  className?: string;
}

export function SimpleProgress({ value, className = "" }: SimpleProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div 
        className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-out rounded-full"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}