import { lazy, Suspense, useState, useEffect, useRef, memo } from 'react';
import Hero from '../components/Hero/Hero';

// الصفحات الثقيلة — lazy loaded
const EmergencyPage   = lazy(() => import('./EmergencyPage'));
const PostsPage       = lazy(() => import('./PostsPage'));
const CoursesPage     = lazy(() => import('./CoursesPage'));
const ServicesPage    = lazy(() => import('./ServicesPage'));
const MarketplacePage = lazy(() => import('./MarketplacePage'));

// ── Skeleton placeholder ───────────────────────────────────────
const SectionSkeleton = memo(({ label }) => (
  <div
    role="status"
    aria-label={`جاري تحميل ${label}`}
    className="min-h-96 flex flex-col items-center justify-center gap-3 text-gray-400"
  >
    <div className="w-8 h-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
    <span className="text-sm animate-pulse">{label}</span>
  </div>
));
SectionSkeleton.displayName = 'SectionSkeleton';

// ── Lazy section with IntersectionObserver ─────────────────────
const LazySection = memo(({ children, id, fallbackLabel }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 400px قبل الوصول → يبدأ التحميل مبكراً لتحسين LCP
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} aria-label={fallbackLabel}>
      {isVisible
        ? (
          <Suspense fallback={<SectionSkeleton label={fallbackLabel} />}>
            {children}
          </Suspense>
        )
        : (
          // placeholder بأبعاد ثابتة يمنع CLS عند التحميل
          <div
            className="min-h-96"
            aria-hidden="true"
            style={{ contain: 'layout' }}
          />
        )
      }
    </section>
  );
});
LazySection.displayName = 'LazySection';

// ── Page ───────────────────────────────────────────────────────
const HomePage = () => (
  <main>
    {/* Hero — يُحمَّل فوراً (LCP element) */}
    <section id="home">
      <Hero />
    </section>

    <LazySection id="emergency" fallbackLabel="الطوارئ">
      <EmergencyPage />
    </LazySection>

    <LazySection id="posts" fallbackLabel="المنشورات">
      <PostsPage />
    </LazySection>

    <LazySection id="courses" fallbackLabel="الكورسات">
      <CoursesPage />
    </LazySection>

    <LazySection id="services" fallbackLabel="الخدمات">
      <ServicesPage />
    </LazySection>

    <LazySection id="marketplace" fallbackLabel="المتجر">
      <MarketplacePage />
    </LazySection>
  </main>
);

export default HomePage;