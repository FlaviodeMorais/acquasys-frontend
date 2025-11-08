interface SeparatorProps {
  className?: string;
}

export function Separator({ className = "" }: SeparatorProps) {
  return (
    <div className={`shrink-0 bg-gray-200 dark:bg-gray-700 h-[1px] w-full ${className}`} />
  );
}