import { useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Shared/Button';

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

const Hero = memo(() => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const handleSOS = useCallback(() => scrollTo('emergency'), []);
  const handleLearn = useCallback(() => scrollTo('posts'), []);

  return (
    <div className="container mt-1">
      <div className="relative overflow-hidden rounded-3xl min-h-[550px] flex items-center bg-gradient-to-br from-gray-50/80 via-white/80 to-gray-100/80 dark:from-gray-900/80 dark:via-gray-800/80 dark:to-gray-900/80 shadow-lg border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
        <div className={`flex flex-col md:flex-row w-full ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          {/* الصورة - ✅ محسّنة مع الحفاظ على الظهور */}
          <div className="w-full md:w-1/2 h-full min-h-[300px] md:min-h-full overflow-hidden flex items-center justify-center p-4">
            <img
              src={`${import.meta.env.BASE_URL}emergency.png`}
              alt={t('hero.title')}
              width={400}
              height={400}
              fetchpriority="high"
              loading="eager"
              decoding="async"
              className="w-full h-full object-contain transition-transform duration-700 hover:scale-105"
              style={{ aspectRatio: '1/1' }}
            />
          </div>

          {/* النص */}
          <div
            className={`w-full md:w-1/2 flex flex-col justify-center gap-4 p-6 md:p-10 lg:p-12 ${isRTL ? 'text-right' : 'text-left'
              } animate-fade-up`}
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-primary leading-tight drop-shadow-sm">
              {t('hero.title')}
            </h1>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-800 dark:text-white">
              {t('hero.subtitle')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed">
              {t('hero.description')}
            </p>
            <div className={`flex gap-4 flex-wrap ${isRTL ? 'justify-start' : 'justify-start'}`}>
              <Button
                text={t('hero.sosButton')}
                bgColor="bg-red-600 hover:bg-red-700 active:bg-red-800"
                textColor="text-white"
                handler={handleSOS}
                ariaLabel={t('emergency.sos')}
              />
              <button
                onClick={handleLearn}
                className="px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 active:scale-[0.98] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                aria-label={t('hero.learnMore')}
              >
                {t('hero.learnMore')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Hero.displayName = 'Hero';
export default Hero;