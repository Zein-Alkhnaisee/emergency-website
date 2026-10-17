import { lazy, Suspense, useState, useEffect, useRef, memo } from 'react';
import Hero from '../components/Hero/Hero';
import Footer from '../components/Layout/Footer';
import { SkeletonPostsList, SkeletonServicesGrid } from '../components/UI/Skeleton';

// الصفحات الثقيلة — lazy loaded
const EmergencyPage = lazy(() => import('./EmergencyPage'));
const PostsPage = lazy(() => import('./PostsPage'));
const CoursesPage = lazy(() => import('./CoursesPage'));
const ServicesPage = lazy(() => import('./ServicesPage'));
const MarketplacePage = lazy(() => import('./MarketplacePage'));

// ── Skeleton placeholder محسّن للجوال ──
const SectionSkeleton = memo(({ type = 'posts' }) => {
  if (type === 'posts') {
    return <SkeletonPostsList count={3} />;
  }
  return <SkeletonServicesGrid count={3} />;
});
SectionSkeleton.displayName = 'SectionSkeleton';

// ── Lazy section with IntersectionObserver ──
const LazySection = memo(({ children, id, fallbackLabel, type = 'posts' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // ✅ تقليل الـ rootMargin للجوال
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} aria-label={fallbackLabel} className="scroll-mt-16">
      {isVisible ? (
        <Suspense fallback={<SectionSkeleton type={type} />}>
          {children}
        </Suspense>
      ) : (
        <div className="min-h-[200px] sm:min-h-[300px]" aria-hidden="true" style={{ contain: 'layout' }} />
      )}
    </section>
  );
});
LazySection.displayName = 'LazySection';

// ── Page ──
const HomePage = () => (
  <main>
    <section id="home">
      <Hero />
    </section>

    <LazySection id="emergency" fallbackLabel="الطوارئ" type="emergency">
      <EmergencyPage />
    </LazySection>

    <LazySection id="posts" fallbackLabel="المنشورات" type="posts">
      <PostsPage />
    </LazySection>

    <LazySection id="courses" fallbackLabel="الكورسات" type="courses">
      <CoursesPage />
    </LazySection>

    <LazySection id="services" fallbackLabel="الخدمات" type="services">
      <ServicesPage />
    </LazySection>

    <LazySection id="marketplace" fallbackLabel="المتجر" type="marketplace">
      <MarketplacePage />
    </LazySection>

    <Footer />
  </main>
);

export default HomePage;