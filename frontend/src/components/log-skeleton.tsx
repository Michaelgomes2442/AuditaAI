import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LogSkeleton() {
  return (
    <div data-testid="log-skeleton" className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 text-sm">
          <div className="min-w-[150px]">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FilterSkeleton() {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <Skeleton className="h-10 w-[200px]" />
      <Skeleton className="h-10 w-[200px]" />
      <Skeleton className="h-10 w-[150px]" />
      <Skeleton className="h-10 w-[150px]" />
    </div>
  );
}