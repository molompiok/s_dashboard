import clsx from "clsx";
import { Topbar } from "../TopBar/TopBar";
export function CategoryFormSkeleton() {
  return (
    <div className="w-full flex flex-col  min-h-screen">
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
  return <div className="h-12 w-full -b bg-white dark:bg-gray-800" />;
}


export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-gray-200 dark:bg-gray-500  rounded-md",
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
      <div className="rounded-2xl  p-4 bg-white dark:bg-gray-800 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div className="h-20 w-20 bg-gray-200 dark:bg-gray-500  rounded-md" />
          <div className="flex-1 ml-4 space-y-2">
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-500  rounded" />
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-500  rounded" />
            <div className="h-6 w-24 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* Infos client */}
      <div className="rounded-2xl  p-4 bg-white dark:bg-gray-800 shadow-sm space-y-3">
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-500  rounded" />
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-500 " />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-500  rounded" />
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-500  rounded" />
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-500  rounded" />
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl  p-4 bg-white dark:bg-gray-800 shadow-sm flex space-x-4"
          >
            <div className="h-20 w-20 bg-gray-200 dark:bg-gray-500  rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-500  rounded" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-500  rounded" />
              <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-500  rounded" />
              <div className="h-6 w-20 bg-gray-300 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Statuts */}
      <div className="rounded-2xl  p-4 bg-white dark:bg-gray-800 shadow-sm space-y-4">
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-500  rounded" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-4 w-2/3 bg-gray-200 dark:bg-gray-500  rounded" />
          ))}
        </div>
        <div className="h-8 w-32 bg-gray-300 rounded-md ml-auto" />
      </div>

    </div>
  );
}

// Ce composant interne imite une section du formulaire
const SkeletonSection = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 p-4 sm:p-6 space-y-6">
        {children}
    </div>
);

// Le Skeleton principal
export function ProductFormSkeleton() {
    return (
        <div className="w-full min-h-screen flex flex-col animate-pulse">
            {/* Le Topbar est fixe et non "pulsant" pour donner un point d'ancrage visuel */}
            <Topbar back title="..." />

            <main className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">
                {/* 1. Squelette du Stepper */}
                <div className="flex items-center justify-center p-2 bg-gray-100/50 dark:bg-black/10 rounded-xl space-x-2 sm:space-x-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                <div className="mt-2 h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                            </div>
                            {i < 3 && <div className="hidden sm:block w-10 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700" />}
                        </div>
                    ))}
                </div>

                {/* 2. Squelette de la première étape ("Informations Générales") */}
                <SkeletonSection>
                    {/* Titre de la section */}
                    <div className="h-7 w-1/3 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                    
                    {/* Champ Nom */}
                    <div className="space-y-2">
                        <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-500 rounded"></div>
                        <div className="h-10 w-full bg-gray-200 dark:bg-gray-500 rounded-lg"></div>
                    </div>

                    {/* Gestionnaire d'images */}
                     <div className="space-y-2">
                        <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-500 rounded"></div>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-500 rounded-lg" />
                            ))}
                            <div className="aspect-square bg-gray-100 dark:bg-gray-600/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"></div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-500 rounded"></div>
                        <div className="h-32 w-full bg-gray-200 dark:bg-gray-500 rounded-lg"></div>
                    </div>

                    {/* Prix */}
                    <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-500 rounded"></div>
                            <div className="h-10 w-full bg-gray-200 dark:bg-gray-500 rounded-lg"></div>
                        </div>
                         <div className="space-y-2">
                            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-500 rounded"></div>
                            <div className="h-10 w-full bg-gray-200 dark:bg-gray-500 rounded-lg"></div>
                        </div>
                    </div>
                </SkeletonSection>

                 {/* 3. Squelette des boutons de navigation */}
                 <div className="flex justify-between items-center mt-8 border-t dark:border-gray-700 pt-6">
                    <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-10 w-28 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                 </div>
            </main>
        </div>
    );
}


export function StockProductSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Topbar />
      {/* Top Card */}
      <div className="rounded-2xl  p-4 bg-white dark:bg-gray-800 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div className="h-20 w-20 bg-gray-200 dark:bg-gray-500  rounded-md" />
          <div className="flex-1 ml-4 space-y-2">
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-500  rounded" />
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-500  rounded" />
            <div className="h-6 w-24 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl  p-4 bg-white dark:bg-gray-800 shadow-sm flex space-x-4"
          >
            <div className="h-20 w-20 bg-gray-200 dark:bg-gray-500  rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-500  rounded" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-500  rounded" />
              <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-500  rounded" />
              <div className="h-6 w-20 bg-gray-300 rounded-full" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
