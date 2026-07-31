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
      <div className="hero-bg-color overflow-hidden rounded-3xl min-h-[550px] flex items-center">
        {/* استخدمنا flex بدلاً من grid للتحكم الكامل بالترتيب حسب اللغة */}
        <div
          className={`flex flex-col md:flex-row w-full ${
            isRTL ? 'md:flex-row-reverse' : ''
          }`}
        >
          {/* الصورة */}
          <div className="w-full md:w-1/2 h-full min-h-[300px] md:min-h-full overflow-hidden flex items-center justify-center">
            <img
              src="/emergency.png"
              alt={t('hero.title')}
              width={400}
              height={400}
              fetchpriority="high"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover"
              style={{ aspectRatio: '1/1' }}
            />
          </div>

          {/* النص */}
          <div
            className={`w-full md:w-1/2 flex flex-col justify-center gap-4 p-6 md:p-10 lg:p-12 ${
              isRTL ? 'text-right' : 'text-left'
            }`}
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-primary leading-tight">
              {t('hero.title')}
            </h1>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              {t('hero.subtitle')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed">
              {t('hero.description')}
            </p>
            <div
              className={`flex gap-4 flex-wrap ${
                isRTL ? 'justify-start' : 'justify-start'
              }`}
            >
              <Button
                text={t('hero.sosButton')}
                bgColor="bg-red-600 hover:bg-red-700 active:bg-red-800"
                textColor="text-white"
                handler={handleSOS}
                ariaLabel={t('emergency.sos')}
              />
              <Button
                text={t('hero.learnMore')}
                bgColor="bg-transparent border-2 border-primary hover:bg-primary/5"
                textColor="text-primary"
                handler={handleLearn}
                ariaLabel={t('hero.learnMore')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Hero.displayName = 'Hero';
export default Hero;