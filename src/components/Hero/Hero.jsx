import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Shared/Button';

const Hero = ({ handleOrderPopup }) => {
  const { t } = useTranslation();

  return (
    <div className='container mt-1'>
      <div className='hero-bg-color overflow-hidden rounded-3xl min-h-[550px] flex justify-center items-center'>
        <div className='container pb-8 sm:pb-0'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 items-center'>
            {/* النص */}
            <div className='flex flex-col justify-center gap-4 sm:pl-3 pt-12 sm:pt-0 text-center md:text-left order-2 md:order-1'>
              <h1 className='text-4xl sm:text-6xl lg:text-7xl font-bold text-primary'>
                {t('hero.title')}
              </h1>
              <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold'>
                {t('hero.subtitle')}
              </h1>
              <p className='text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto md:mx-0'>
                {t('hero.description')}
              </p>
              <div className='flex gap-4 justify-center md:justify-start'>
                <Button
                  text={t('hero.sosButton')}
                  bgColor="bg-red-600 hover:bg-red-700"
                  textColor="text-white"
                  handler={() => {
                    const emergencySection = document.getElementById('emergency');
                    if (emergencySection) emergencySection.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
                <Button
                  text={t('hero.learnMore')}
                  bgColor="bg-transparent border-2 border-primary"
                  textColor="text-primary"
                  handler={() => {
                    const aboutSection = document.getElementById('about');
                    if (aboutSection) aboutSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              </div>
            </div>
            {/* الصورة */}
            <div className='order-1 md:order-2 flex justify-center'>
              <img
                src="/emergency.png"
                alt="Emergency"
                className='w-[280px] sm:w-[400px] object-contain drop-shadow-2xl'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;