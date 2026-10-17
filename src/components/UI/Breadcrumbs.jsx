import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight, FaHome } from 'react-icons/fa';
import { useLanguage } from '../../contexts/LanguageContext';

const routeNameMap = (t) => ({
    '': t('nav.home'),
    'login': t('login'),
    'register': t('register'),
    'profile': t('nav.profile'),
    'my-articles': t('posts.myArticles'),
    'my-comments': t('comments.myComments'),
    'role-requests': t('nav.roleRequests'),
    'emergency-chat': t('emergency.chat'),
    'my-case': t('emergency.myCase'),
    'notifications': t('notifications.title'),
    'trust-verification': t('nav.trustVerification'),
    'all-articles': t('posts.allArticles'),
    'emergency': t('nav.emergency'),
    'services': t('nav.services'),
    'courses': t('nav.courses'),
    'marketplace': t('nav.marketplace'),
    'rescue-requests': t('emergency.rescueRequests'),
    'group-members': t('emergency.groupMembers'),
});

const Breadcrumbs = () => {
    const location = useLocation();
    const { t } = useTranslation();
    const { currentLang } = useLanguage();
    const isRTL = currentLang === 'ar';

    const pathnames = location.pathname.split('/').filter((x) => x);

    // إذا كنا في الصفحة الرئيسية، لا نعرض الـ Breadcrumbs
    if (pathnames.length === 0 && location.pathname === '/') {
        return null;
    }

    // بناء المسار الكامل لكل عنصر
    let currentPath = '';

    return (
        <nav
            className="container mx-auto px-4 py-3 text-sm flex items-center gap-2 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl mt-4 mb-2 border border-gray-100 dark:border-gray-700/50"
            aria-label="Breadcrumb"
        >
            <Link
                to="/"
                className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors duration-200 hover:scale-105"
            >
                <FaHome className="text-sm" />
                <span className="hidden sm:inline">{t('nav.home')}</span>
            </Link>

            {pathnames.map((name, index) => {
                currentPath += `/${name}`;
                const isLast = index === pathnames.length - 1;
                const label = routeNameMap(t)[name] || name.replace(/-/g, ' ');

                return (
                    <div key={currentPath} className="flex items-center gap-2">
                        <span className="text-gray-300 dark:text-gray-600">
                            {isRTL ? <FaChevronLeft className="text-[10px]" /> : <FaChevronRight className="text-[10px]" />}
                        </span>
                        {isLast ? (
                            <span className="font-medium text-gray-700 dark:text-gray-200">
                                {label}
                            </span>
                        ) : (
                            <Link
                                to={currentPath}
                                className="hover:text-primary transition-colors duration-200 hover:underline"
                            >
                                {label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;