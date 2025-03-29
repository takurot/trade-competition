import React from 'react';
import { useTranslation } from 'react-i18next';

// 株価情報の型定義
interface StockPriceInfo {
  symbol: string;
  price: number;
  currency: string;
  previousClose: number;
  priceChange: number;
  changePercent: number;
  timestamp: number;
  timezone: string;
}

interface StockPriceProps {
  data: StockPriceInfo | null;
  loading: boolean;
  error: string | null;
  onUsePrice?: (price: number) => void;
}

const StockPrice: React.FC<StockPriceProps> = ({ data, loading, error, onUsePrice }) => {
  const { t } = useTranslation();

  if (loading) {
    return <div className="stock-price-loading">{t('loadingPrice')}...</div>;
  }

  if (error) {
    return <div className="stock-price-error">{error}</div>;
  }

  if (!data) {
    return null;
  }

  const formattedPrice = data.price.toFixed(2);
  const formattedChange = data.priceChange.toFixed(2);
  const formattedPercent = data.changePercent.toFixed(2);
  const isPositive = data.priceChange >= 0;
  const changeClass = isPositive ? 'positive' : 'negative';
  const changeSymbol = isPositive ? '+' : '';

  // タイムスタンプをフォーマット
  const date = new Date(data.timestamp * 1000);
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="stock-price-container">
      <div className="stock-price-header">
        <span className="stock-price-symbol">{data.symbol}</span>
        <span className="stock-price-time">{formattedTime}</span>
      </div>

      <div className="stock-price-main">
        <div className="stock-price-value">
          {formattedPrice} {data.currency}
        </div>
        <div className={`stock-price-change ${changeClass}`}>
          {changeSymbol}{formattedChange} ({changeSymbol}{formattedPercent}%)
        </div>
      </div>

      {onUsePrice && (
        <button 
          className="stock-price-use-btn"
          onClick={() => onUsePrice(data.price)}
        >
          {t('useThisPrice')}
        </button>
      )}
    </div>
  );
};

export default StockPrice; 