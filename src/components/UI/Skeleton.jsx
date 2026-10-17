import { memo } from 'react';
import { useTranslation } from 'react-i18next';

// ── Skeleton Base ──
const Skeleton = memo(({ className = '', width = '100%', height = '20px', rounded = 'rounded-xl' }) => {
  return (
    <div
      className={`skeleton ${rounded} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
});
Skeleton.displayName = 'Skeleton';

// ── Skeleton Text ──
const SkeletonText = memo(({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={i === 0 ? '24px' : '16px'}
          width={i === 0 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
});
SkeletonText.displayName = 'SkeletonText';

// ── Skeleton Avatar ──
const SkeletonAvatar = memo(({ size = 'w-12 h-12', className = '' }) => {
  return <Skeleton className={`rounded-full ${size} ${className}`} width="100%" height="100%" />;
});
SkeletonAvatar.displayName = 'SkeletonAvatar';

// ── Skeleton Card ──
const SkeletonCard = memo(({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonAvatar size="w-10 h-10" />
        <div className="flex-1">
          <Skeleton height="16px" width="60%" />
          <Skeleton height="12px" width="40%" className="mt-1" />
        </div>
      </div>
      <Skeleton height="180px" className="mb-4" />
      <SkeletonText lines={2} />
      <div className="flex gap-2 mt-4">
        <Skeleton height="36px" width="80px" />
        <Skeleton height="36px" width="80px" />
      </div>
    </div>
  );
});
SkeletonCard.displayName = 'SkeletonCard';

// ── Skeleton Post Card ──
const SkeletonPostCard = memo(({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonAvatar size="w-10 h-10" />
        <div className="flex-1">
          <Skeleton height="16px" width="50%" />
          <Skeleton height="12px" width="30%" className="mt-1" />
        </div>
      </div>
      <Skeleton height="24px" width="70%" className="mb-2" />
      <SkeletonText lines={3} />
      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <Skeleton height="32px" width="60px" />
        <Skeleton height="32px" width="60px" />
        <Skeleton height="32px" width="60px" className="mr-auto" />
      </div>
    </div>
  );
});
SkeletonPostCard.displayName = 'SkeletonPostCard';

// ── Skeleton Service Card ──
const SkeletonServiceCard = memo(({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <Skeleton height="20px" width="60%" />
        <Skeleton height="20px" width="60px" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Skeleton height="16px" width="100px" />
        <Skeleton height="16px" width="40px" />
      </div>
      <Skeleton height="14px" width="80%" className="mb-2" />
      <Skeleton height="14px" width="60%" className="mb-2" />
      <Skeleton height="14px" width="50%" className="mb-4" />
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <Skeleton height="36px" width="100%" />
      </div>
    </div>
  );
});
SkeletonServiceCard.displayName = 'SkeletonServiceCard';

// ── Skeleton Course Card ──
const SkeletonCourseCard = memo(({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="relative mb-4">
        <Skeleton height="140px" className="rounded-xl" />
        <Skeleton height="20px" width="60px" className="absolute top-3 right-3" />
      </div>
      <div className="flex justify-between items-center mb-3">
        <Skeleton height="16px" width="60%" />
        <Skeleton height="16px" width="60px" />
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <Skeleton height="32px" width="60px" />
        <Skeleton height="32px" width="60px" />
        <Skeleton height="32px" width="60px" className="mr-auto" />
      </div>
    </div>
  );
});
SkeletonCourseCard.displayName = 'SkeletonCourseCard';

// ── Skeleton Grid ──
const SkeletonGrid = memo(({ columns = 3, count = 6, CardComponent = SkeletonCard }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardComponent key={i} />
      ))}
    </div>
  );
});
SkeletonGrid.displayName = 'SkeletonGrid';

// ── Skeleton Posts List ──
const SkeletonPostsList = memo(({ count = 3 }) => {
  const { t } = useTranslation();
  return (
    <div className="container my-10 px-4">
      <div className="text-center mb-10 max-w-2xl mx-auto space-y-2">
        <div className="h-8 w-48 skeleton rounded-lg mx-auto" />
        <div className="h-4 w-64 skeleton rounded-lg mx-auto" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonPostCard key={i} />
        ))}
      </div>
    </div>
  );
});
SkeletonPostsList.displayName = 'SkeletonPostsList';

// ── Skeleton Services Grid ──
const SkeletonServicesGrid = memo(({ count = 6 }) => {
  const { t } = useTranslation();
  return (
    <div className="container my-10 px-4">
      <div className="text-center mb-10 max-w-2xl mx-auto space-y-2">
        <div className="h-8 w-48 skeleton rounded-lg mx-auto" />
        <div className="h-4 w-64 skeleton rounded-lg mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonServiceCard key={i} />
        ))}
      </div>
    </div>
  );
});
SkeletonServicesGrid.displayName = 'SkeletonServicesGrid';

// ── Skeleton Courses Grid ──
const SkeletonCoursesGrid = memo(({ count = 6 }) => {
  const { t } = useTranslation();
  return (
    <div className="container my-10 px-4">
      <div className="text-center mb-10 max-w-2xl mx-auto space-y-2">
        <div className="h-8 w-48 skeleton rounded-lg mx-auto" />
        <div className="h-4 w-64 skeleton rounded-lg mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCourseCard key={i} />
        ))}
      </div>
    </div>
  );
});
SkeletonCoursesGrid.displayName = 'SkeletonCoursesGrid';

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonPostCard,
  SkeletonServiceCard,
  SkeletonCourseCard,
  SkeletonGrid,
  SkeletonPostsList,
  SkeletonServicesGrid,
  SkeletonCoursesGrid,
};