import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import LanguageToggle from './shared/LanguageToggle';

const IntroductionTab = lazy(() => import('./tabs/IntroductionTab'));
const PsychroDiagramTab = lazy(() => import('./tabs/PsychroDiagramTab'));
const GeoLocationTab = lazy(() => import('./tabs/GeoLocationTab'));
const EnergyBalanceTab = lazy(() => import('./tabs/EnergyBalanceTab'));
const MoistureBalanceTab = lazy(() => import('./tabs/MoistureBalanceTab'));
const MoistureControlTab = lazy(() => import('./tabs/MoistureControlTab'));

interface TabDef {
  key: string;
  labelKey: string;
  extraOnly: boolean;
}

const TABS: TabDef[] = [
  { key: 'intro', labelKey: 'tabs.introduction', extraOnly: false },
  { key: 'psychro', labelKey: 'tabs.psychroDiagram', extraOnly: false },
  { key: 'geo', labelKey: 'tabs.geoLocation', extraOnly: false },
  { key: 'energy', labelKey: 'tabs.energyBalance', extraOnly: true },
  { key: 'moisture', labelKey: 'tabs.moistureBalance', extraOnly: true },
  { key: 'mc', labelKey: 'tabs.moistureControl', extraOnly: true },
];

export default function Layout() {
  const { t } = useTranslation();
  const { ui, toggleShowExtra, setActiveTab } = useAppStore();

  const visibleTabs = TABS.filter((tab) => !tab.extraOnly || ui.showExtra);

  const renderTab = () => {
    const tabKey = visibleTabs[ui.activeTab]?.key ?? 'intro';
    switch (tabKey) {
      case 'intro':
        return <IntroductionTab />;
      case 'psychro':
        return <PsychroDiagramTab />;
      case 'geo':
        return <GeoLocationTab />;
      case 'energy':
        return <EnergyBalanceTab />;
      case 'moisture':
        return <MoistureBalanceTab />;
      case 'mc':
        return <MoistureControlTab />;
      default:
        return <IntroductionTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-teal shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}geneina-logo-white.svg`}
              alt="Geneina"
              className="h-8"
            />
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button
              onClick={toggleShowExtra}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                ui.showExtra
                  ? 'bg-brand-green text-white hover:bg-brand-green-light'
                  : 'border border-white/30 text-white hover:bg-white/10'
              }`}
            >
              {ui.showExtra ? t('app.hideExtra') : t('app.showExtra')}
            </button>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-0">
          {visibleTabs.map((tab, index) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                ui.activeTab === index
                  ? 'border-brand-green text-brand-teal font-semibold'
                  : 'border-transparent text-gray-500 hover:text-brand-teal hover:border-brand-blue'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          {renderTab()}
        </Suspense>
      </main>
    </div>
  );
}
