import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles.css';

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // 言語設定をローカルストレージに保存
    localStorage.setItem('language', lng);
  };

  return (
    <div className="language-switcher">
      <span>{t('language')}: </span>
      <button 
        onClick={() => changeLanguage('en')} 
        className={`language-btn ${i18n.language === 'en' ? 'active' : ''}`}
      >
        {t('english')}
      </button>
      <button 
        onClick={() => changeLanguage('ja')} 
        className={`language-btn ${i18n.language === 'ja' ? 'active' : ''}`}
      >
        {t('japanese')}
      </button>
    </div>
  );
};

export default LanguageSwitcher; 