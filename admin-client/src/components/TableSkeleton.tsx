import React from "react";
import { Skeleton } from "primereact/skeleton";

type TableSkeletonProps = {
  columns?: number;
  rows?: number;
};

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns = 4, rows = 8 }) => {
  const cols = Math.max(1, columns);
  const bodyRows = Math.max(1, rows);

  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="grid grid-cols-12 gap-2 mb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={`hdr-${i}`} className="col-span-3">
            <Skeleton height="1.75rem" className="w-full"></Skeleton>
          </div>
        ))}
      </div>

      {/* Body rows */}
      <div className="space-y-2">
        {Array.from({ length: bodyRows }).map((_, r) => (
          <div key={`row-${r}`} className="grid grid-cols-12 gap-2">
            {Array.from({ length: cols }).map((__, c) => (
              <div key={`cell-${r}-${c}`} className="col-span-3">
                <Skeleton height="1.5rem" className="w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Skeleton shape="circle" width="2rem" height="2rem" />
          <Skeleton shape="circle" width="2rem" height="2rem" />
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`pg-${i}`} shape="circle" size="2rem" />
          ))}
        </div>
        <div className="flex items-center gap-2 ">
          <Skeleton shape="circle" width="2rem" height="2rem"  />
          <Skeleton shape="circle" width="2rem" height="2rem" />
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton;

