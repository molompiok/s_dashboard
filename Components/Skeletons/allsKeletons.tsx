import clsx from "clsx";
import { Topbar } from "../TopBar/TopBar";
export function CategoryFormSkeleton() {
  return (
    <div className="w-full flex flex-col bg-gray-50 min-h-screen">
      <Topbar /> {/* ou un simple div avec h-12 + bg */}
      <main className="w-full max-w-3xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 pb-24">
        <Skeleton className="h-8 w-1/2 rounded" />

        {/* Image de couverture */}
        <div>
          <Skeleton className="w-full aspect-[3/1] rounded-lg" />
        </div>

        {/* Icône + Stats */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Skeleton className="w-36 h-36 rounded-lg" />
          <div className="flex flex-col gap-2 flex-grow pt-6">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>

        {/* Nom */}
        <div>
          <Skeleton className="h-4 w-1/4 mb-2" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Description */}
        <div>
          <Skeleton className="h-4 w-1/4 mb-2" />
          <Skeleton className="h-40 w-full rounded-md" />
        </div>

        {/* Parent Category */}
        <div>
          <Skeleton className="h-4 w-1/3 mb-3" />
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>

        {/* Actions bas de page */}
        <div className="flex gap-2 mt-6">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </main>
    </div>
  );
}

export function TopbarSkeleton() {
  return <div className="h-12 w-full -b bg-white" />;
}


export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-gray-200 rounded-md",
        className
      )}
      {...props}
    />
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Topbar />
      {/* Top Card */}
      <div className="rounded-2xl  p-4 bg-white shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div className="h-20 w-20 bg-gray-200 rounded-md" />
          <div className="flex-1 ml-4 space-y-2">
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-6 w-24 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* Infos client */}
      <div className="rounded-2xl  p-4 bg-white shadow-sm space-y-3">
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl  p-4 bg-white shadow-sm flex space-x-4"
          >
            <div className="h-20 w-20 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/4 bg-gray-200 rounded" />
              <div className="h-6 w-20 bg-gray-300 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Statuts */}
      <div className="rounded-2xl  p-4 bg-white shadow-sm space-y-4">
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-4 w-2/3 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="h-8 w-32 bg-gray-300 rounded-md ml-auto" />
      </div>

    </div>
  );
}

export function ProductFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Topbar />
      {/* Image Carousel */}
      <div className="flex space-x-4 overflow-x-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-60 w-60 bg-gray-200 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Nom du produit */}
      <div className="space-y-2">
        <div className="h-4 w-1/4 bg-gray-200 rounded" />
        <div className="h-10 w-full bg-gray-200 rounded-md" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="h-4 w-1/4 bg-gray-200 rounded" />
        <div className="h-32 w-full bg-gray-200 rounded-md" />
      </div>

      {/* Prix de base */}
      <div className="space-y-2">
        <div className="h-4 w-1/4 bg-gray-200 rounded" />
        <div className="h-10 w-1/2 bg-gray-200 rounded-md" />
      </div>

      {/* Prix barré */}
      <div className="space-y-2">
        <div className="h-4 w-1/4 bg-gray-200 rounded" />
        <div className="h-10 w-1/2 bg-gray-200 rounded-md" />
      </div>

      {/* Catégories */}
      <div className="space-y-2">
        <div className="h-4 w-1/4 bg-gray-200 rounded" />
        <div className="flex space-x-4">
          <div className="h-20 w-16 bg-gray-200 rounded-md" />
          <div className="h-20 w-16 bg-gray-200 rounded-md" />
        </div>
      </div>

      {/* Variantes */}
      <div className="space-y-2">
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
        <div className="h-16 w-full bg-gray-100 rounded-md" />
      </div>

      {/* Visibilité */}
      <div className="flex space-x-4">
        <div className="h-10 w-24 bg-gray-200 rounded-md" />
        <div className="h-10 w-24 bg-gray-200 rounded-md" />
      </div>

    </div>
  );
}



export function StockProductSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Topbar />
      {/* Top Card */}
      <div className="rounded-2xl  p-4 bg-white shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div className="h-20 w-20 bg-gray-200 rounded-md" />
          <div className="flex-1 ml-4 space-y-2">
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-6 w-24 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl  p-4 bg-white shadow-sm flex space-x-4"
          >
            <div className="h-20 w-20 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/4 bg-gray-200 rounded" />
              <div className="h-6 w-20 bg-gray-300 rounded-full" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
