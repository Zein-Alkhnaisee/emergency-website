import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Button from '../Shared/Button';

const FallbackUI = memo(({ error, errorInfo, onReset, componentName }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
        onReset?.();
    };

    const handleRetry = () => {
        onReset?.();
        window.location.reload();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-up">
            <div className="text-6xl mb-4 text-red-500">
                <FaExclamationTriangle />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {t('error.somethingWentWrong') || 'حدث خطأ ما'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                {t('error.errorOccurredIn', { component: componentName }) || `حدث خطأ في ${componentName}`}
                {error && (
                    <span className="block text-sm text-red-400 mt-2 font-mono">
                        {error.toString()}
                    </span>
                )}
                {errorInfo && process.env.NODE_ENV === 'development' && (
                    <details className="mt-4 text-left text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-auto max-h-48">
                        <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-300">
                            {t('error.details') || 'تفاصيل الخطأ'}
                        </summary>
                        <pre className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {errorInfo.componentStack}
                        </pre>
                    </details>
                )}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
                <Button
                    text={t('common.retry') || 'إعادة المحاولة'}
                    bgColor="bg-primary"
                    textColor="text-white"
                    handler={handleRetry}
                    icon={<FaRedo className="mr-2" />}
                />
                <Button
                    text={t('common.back') || 'الرئيسية'}
                    bgColor="bg-gray-200 dark:bg-gray-700"
                    textColor="text-gray-700 dark:text-gray-300"
                    handler={handleGoHome}
                    icon={<FaHome className="mr-2" />}
                />
            </div>
        </div>
    );
});

FallbackUI.displayName = 'FallbackUI';
export default FallbackUI;