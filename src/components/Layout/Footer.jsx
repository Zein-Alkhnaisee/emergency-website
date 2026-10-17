// src/components/Layout/Footer.jsx
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as ScrollLink } from 'react-scroll';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaHeart,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from 'react-icons/fa';

const NAV_SECTIONS = ['home', 'emergency', 'posts', 'courses', 'services', 'marketplace'];

const Footer = memo(() => {
  const { t } = useTranslation();
  const { currentLang } = useLanguage();
  const location = useLocation();
  const isRTL = currentLang === 'ar';
  const currentYear = new Date().getFullYear();

  // التحقق إذا كنا في الصفحة الرئيسية
  const isHomePage = location.pathname === '/';

  // رابط القسم: ScrollLink في الصفحة الرئيسية، رابط عادي في الصفحات الأخرى
  const SectionLink = ({ section, children }) => {
    if (isHomePage) {
      return (
        <ScrollLink
          to={section}
          spy={true}
          smooth={true}
          duration={500}
          offset={-70}
          className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors cursor-pointer"
          href={`#${section}`}
        >
          {children}
        </ScrollLink>
      );
    }
    return (
      <a href={`/#${section}`} className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
        {children}
      </a>
    );
  };

  return (
    <footer
      className="bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-800 mt-auto"
      role="contentinfo"
      aria-label="تذييل الصفحة"
    >
      <div className="container mx-auto px-4 py-12">
        {/* ── الشبكة الرئيسية ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* القسم 1: معلومات الموقع */}
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">E‑Help</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('footer.description', 'منصة مجتمعية للاستجابة السريعة لحالات الطوارئ، نربط المتطوعين مع المحتاجين للمساعدة.')}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-colors"
                aria-label="فيسبوك"
              >
                <FaFacebook className="text-lg" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-colors"
                aria-label="تويتر"
              >
                <FaTwitter className="text-lg" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-colors"
                aria-label="إنستغرام"
              >
                <FaInstagram className="text-lg" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-colors"
                aria-label="يوتيوب"
              >
                <FaYoutube className="text-lg" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-colors"
                aria-label="لينكد إن"
              >
                <FaLinkedin className="text-lg" />
              </a>
            </div>
          </div>

          {/* القسم 2: روابط سريعة */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
              {t('footer.quickLinks', 'روابط سريعة')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {NAV_SECTIONS.map((section) => (
                <li key={section}>
                  <SectionLink section={section}>
                    {t(`nav.${section}`)}
                  </SectionLink>
                </li>
              ))}
            </ul>
          </div>

          {/* القسم 3: معلومات التواصل */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
              {t('footer.contact', 'تواصل معنا')}
            </h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-3">
                <FaPhone className="text-primary shrink-0" />
                <span dir="ltr">+963 983436003</span>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="text-primary shrink-0" />
                <span>zeinalkhnaisee@gmail.com</span>
              </li>
              <li className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-primary shrink-0" />
                <span>{t('footer.address', 'سوريا، اللاذقية')}</span>
              </li>
            </ul>
          </div>

          {/* القسم 4: عن المنصة */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
              {t('footer.aboutPlatform', 'عن المنصة')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/about"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  {t('footer.aboutUs', 'من نحن')}
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  {t('footer.privacyPolicy', 'سياسة الخصوصية')}
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  {t('footer.termsOfService', 'شروط الخدمة')}
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  {t('footer.faq', 'الأسئلة الشائعة')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── خط فاصل ── */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              &copy; {currentYear} E‑Help. {t('footer.allRightsReserved', 'جميع الحقوق محفوظة.')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              {t('footer.madeWith', 'صُنع بحب')}
              <FaHeart className="text-red-500 text-xs animate-pulse" />
              {t('footer.byTeam', 'من فريق E‑Help')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
export default Footer;