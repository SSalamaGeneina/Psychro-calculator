import { useTranslation } from 'react-i18next';
import { useCallback, useEffect } from 'react';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = isArabic ? 'ar' : 'en';
  }, [isArabic]);

  const toggle = useCallback(() => {
    const newLang = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  }, [isArabic, i18n]);

  return (
    <button
      onClick={toggle}
      className="px-3 py-1 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
      aria-label="Toggle language"
    >
      {isArabic ? 'EN' : 'عربي'}
    </button>
  );
}
