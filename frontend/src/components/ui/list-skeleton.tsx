import { Skeleton } from './skeleton'

interface ListSkeletonProps {
  rows?: number
  columns?: number
}

export function ListSkeleton({ rows = 5, columns = 3 }: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              {columns >= 2 && <Skeleton className="h-3 w-24" />}
              {columns >= 3 && <Skeleton className="h-3 w-20" />}
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
