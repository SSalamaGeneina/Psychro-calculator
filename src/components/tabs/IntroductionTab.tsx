import { useTranslation } from 'react-i18next';

export default function IntroductionTab() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('intro.title')}</h1>
      <p className="text-gray-600 mb-3 leading-relaxed">{t('intro.p1')}</p>
      <p className="text-gray-600 mb-3 leading-relaxed">{t('intro.p2')}</p>
      <p className="text-gray-600 mb-6 leading-relaxed">{t('intro.p3')}</p>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('intro.howTo')}</h2>
      <ol className="space-y-2 text-gray-600 list-decimal ltr:pl-6 rtl:pr-6">
        <li>{t('intro.step1')}</li>
        <li>{t('intro.step2')}</li>
        <li>{t('intro.step3')}</li>
        <li>{t('intro.step4')}</li>
        <li>{t('intro.step5')}</li>
      </ol>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm">{t('intro.extraNote')}</p>
      </div>
    </div>
  );
}
