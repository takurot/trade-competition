import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig.ts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from './Navigation.tsx';
import '../styles.css';

interface Trade {
  id?: string;
  symbol: string;
  quantity: number;
  price: number;
  type: 'buy' | 'sell';
  date: Date;
}

interface Portfolio {
  id?: string;
  name: string;
  strategy: string;
  userId: string;
  visibility: 'public' | 'private';
  relativeReturn: number;
  createdAt: Date;
  updatedAt: Date;
}

// 画面タイプを定義するEnum
enum ViewType {
  LIST = 'list',
  DETAIL = 'detail',
  CREATE = 'create'
}

const Portfolio: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // 現在の表示画面（一覧 or 詳細 or 作成）
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.LIST);
  
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  
  const [newPortfolio, setNewPortfolio] = useState<Omit<Portfolio, 'userId' | 'relativeReturn' | 'createdAt' | 'updatedAt'>>({
    name: '',
    strategy: '',
    visibility: 'private'
  });
  
  const [newTrade, setNewTrade] = useState<Omit<Trade, 'date'>>({
    symbol: '',
    quantity: 0,
    price: 0,
    type: 'buy'
  });

  // 削除確認用の状態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/');
    
    // Load user's portfolios
    const fetchPortfolios = async () => {
      if (!user) return;
      
      const q = query(
        collection(db, 'portfolios'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const portfoliosList: Portfolio[] = [];
      
      querySnapshot.forEach((doc) => {
        portfoliosList.push({ id: doc.id, ...doc.data() as Omit<Portfolio, 'id'> });
      });
      
      setPortfolios(portfoliosList);
    };
    
    fetchPortfolios();
  }, [user, loading, navigate]);

  useEffect(() => {
    // Load trades for selected portfolio
    const fetchTrades = async () => {
      if (!selectedPortfolio) return;
      
      const tradesQuery = query(
        collection(db, `portfolios/${selectedPortfolio}/trades`)
      );
      
      const querySnapshot = await getDocs(tradesQuery);
      const tradesList: Trade[] = [];
      
      querySnapshot.forEach((doc) => {
        tradesList.push({ id: doc.id, ...doc.data() as Omit<Trade, 'id'> });
      });
      
      setTrades(tradesList);
      calculateRelativeReturn(tradesList);
    };
    
    if (selectedPortfolio) {
      fetchTrades();
    }
  }, [selectedPortfolio]);

  const calculateRelativeReturn = (tradesList: Trade[]) => {
    if (!selectedPortfolio || tradesList.length === 0) return;
    
    let investedValue = 0;
    let currentValue = 0;
    
    tradesList.forEach(trade => {
      const tradeValue = trade.quantity * trade.price;
      
      if (trade.type === 'buy') {
        investedValue += tradeValue;
        currentValue += tradeValue;
      } else {
        investedValue -= tradeValue;
        currentValue -= tradeValue;
      }
    });
    
    // Calculate relative return
    const relativeReturn = investedValue !== 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0;
    
    // Update portfolio with calculated return
    if (selectedPortfolio) {
      const portfolioRef = doc(db, 'portfolios', selectedPortfolio);
      setDoc(portfolioRef, { relativeReturn, updatedAt: new Date() }, { merge: true });
      
      // Update local state
      setPortfolios(prev => 
        prev.map(p => 
          p.id === selectedPortfolio ? { ...p, relativeReturn, updatedAt: new Date() } : p
        )
      );
    }
  };

  const createPortfolio = async () => {
    if (!user) return;
    
    try {
      const portfolioData: Omit<Portfolio, 'id'> = {
        ...newPortfolio,
        userId: user.uid,
        relativeReturn: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'portfolios'), portfolioData);
      const newPortfolioWithId = { id: docRef.id, ...portfolioData };
      
      setPortfolios([...portfolios, newPortfolioWithId]);
      setNewPortfolio({ name: '', strategy: '', visibility: 'private' });
      
      // 作成後は一覧に戻る
      setCurrentView(ViewType.LIST);
    } catch (error) {
      console.error('Error creating portfolio:', error);
    }
  };

  const addTrade = async () => {
    if (!selectedPortfolio) return;
    
    try {
      const tradeData: Omit<Trade, 'id'> = {
        ...newTrade,
        date: new Date()
      };
      
      const docRef = await addDoc(
        collection(db, `portfolios/${selectedPortfolio}/trades`),
        tradeData
      );
      
      const newTradeWithId = { id: docRef.id, ...tradeData };
      const updatedTrades = [...trades, newTradeWithId];
      
      setTrades(updatedTrades);
      setNewTrade({ symbol: '', quantity: 0, price: 0, type: 'buy' });
      
      calculateRelativeReturn(updatedTrades);
    } catch (error) {
      console.error('Error adding trade:', error);
    }
  };

  const deleteTrade = async (tradeId: string) => {
    if (!selectedPortfolio || !tradeId) return;
    
    try {
      await deleteDoc(
        doc(db, `portfolios/${selectedPortfolio}/trades`, tradeId)
      );
      
      const updatedTrades = trades.filter(trade => trade.id !== tradeId);
      setTrades(updatedTrades);
      
      calculateRelativeReturn(updatedTrades);
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  const handlePortfolioSelect = (portfolioId: string) => {
    setSelectedPortfolio(portfolioId);
    setCurrentView(ViewType.DETAIL);
  };

  const backToList = () => {
    setCurrentView(ViewType.LIST);
  };

  // ポートフォリオの削除機能
  const deletePortfolio = async () => {
    if (!portfolioToDelete) return;
    
    try {
      // まず、ポートフォリオに関連する全ての取引を削除
      const tradesQuery = query(
        collection(db, `portfolios/${portfolioToDelete}/trades`)
      );
      
      const querySnapshot = await getDocs(tradesQuery);
      
      // 取引を一つずつ削除
      const tradeDeletions = querySnapshot.docs.map(tradeDoc => 
        deleteDoc(doc(db, `portfolios/${portfolioToDelete}/trades`, tradeDoc.id))
      );
      
      // すべての取引の削除が完了するのを待つ
      await Promise.all(tradeDeletions);
      
      // 次に、ポートフォリオ自体を削除
      await deleteDoc(doc(db, 'portfolios', portfolioToDelete));
      
      // 状態を更新
      setPortfolios(portfolios.filter(p => p.id !== portfolioToDelete));
      setShowDeleteConfirm(false);
      setPortfolioToDelete(null);
      
    } catch (error) {
      console.error('Error deleting portfolio:', error);
    }
  };

  // 削除ボタンのクリックハンドラ（確認ダイアログを表示）
  const handleDeleteClick = (e: React.MouseEvent, portfolioId: string) => {
    e.stopPropagation(); // ポートフォリオカードのクリックイベントが発火するのを防ぐ
    setPortfolioToDelete(portfolioId);
    setShowDeleteConfirm(true);
  };

  // 削除確認ダイアログのキャンセルハンドラ
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setPortfolioToDelete(null);
  };

  if (loading) return <div>{t('loading')}</div>;
  if (!user) return <div>Please sign in to continue</div>;

  // ポートフォリオ一覧表示
  const renderPortfolioList = () => {
    return (
      <div>
        <div className="portfolio-header">
          <h1>{t('portfolioTitle')}</h1>
          <button 
            onClick={() => setCurrentView(ViewType.CREATE)} 
            className="create-portfolio-btn"
          >
            + {t('createPortfolio')}
          </button>
        </div>
        
        {portfolios.length === 0 ? (
          <div className="portfolio-section">
            <p>{t('noPortfolios')}</p>
          </div>
        ) : (
          <div className="portfolio-grid">
            {portfolios.map(portfolio => (
              <div 
                key={portfolio.id} 
                className="portfolio-card" 
                onClick={() => portfolio.id && handlePortfolioSelect(portfolio.id)}
              >
                <button 
                  className="delete-portfolio-btn"
                  onClick={(e) => portfolio.id && handleDeleteClick(e, portfolio.id)}
                  title={t('deletePortfolio')}
                >
                  ×
                </button>
                <h3>{portfolio.name}</h3>
                <p className={portfolio.relativeReturn >= 0 ? 'positive' : 'negative'}>
                  {portfolio.relativeReturn >= 0 ? '+' : ''}{portfolio.relativeReturn.toFixed(2)}%
                </p>
                <p className="portfolio-visibility">
                  {portfolio.visibility === 'public' ? 
                    <span className="public-badge">{t('public')}</span> : 
                    <span className="private-badge">{t('private')}</span>
                  }
                </p>
                <p className="portfolio-strategy">{portfolio.strategy}</p>
              </div>
            ))}
          </div>
        )}
        
        {/* 削除確認ダイアログ */}
        {showDeleteConfirm && (
          <div className="confirm-dialog-overlay">
            <div className="confirm-dialog">
              <h3>{t('deleteConfirmTitle')}</h3>
              <p>{t('deleteConfirmMessage')}</p>
              <div className="confirm-dialog-buttons">
                <button onClick={handleCancelDelete} className="cancel-btn">
                  {t('cancel')}
                </button>
                <button onClick={deletePortfolio} className="delete-btn">
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ポートフォリオ作成画面
  const renderCreatePortfolio = () => {
    return (
      <div>
        <div className="portfolio-header">
          <h1>{t('createPortfolio')}</h1>
          <button onClick={backToList} className="back-btn">
            ← {t('backToList')}
          </button>
        </div>

        <div className="portfolio-section">
          <div className="form-group">
            <label>{t('portfolioName')}</label>
            <input
              type="text"
              placeholder={t('portfolioName')}
              value={newPortfolio.name}
              onChange={(e) => setNewPortfolio({...newPortfolio, name: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>{t('tradingStrategy')}</label>
            <textarea
              placeholder={t('strategyPlaceholder')}
              value={newPortfolio.strategy}
              onChange={(e) => setNewPortfolio({...newPortfolio, strategy: e.target.value})}
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label>{t('visibility')}</label>
            <select
              value={newPortfolio.visibility}
              onChange={(e) => setNewPortfolio({
                ...newPortfolio, 
                visibility: e.target.value as 'public' | 'private'
              })}
            >
              <option value="private">{t('private')}</option>
              <option value="public">{t('public')}</option>
            </select>
          </div>
          
          <button onClick={createPortfolio} className="create-btn">{t('createButton')}</button>
        </div>
      </div>
    );
  };

  // ポートフォリオ詳細画面
  const renderPortfolioDetail = () => {
    const portfolio = portfolios.find(p => p.id === selectedPortfolio);
    
    if (!portfolio) {
      return <div>{t('portfolioNotFound')}</div>;
    }
    
    return (
      <div>
        <div className="portfolio-header">
          <div>
            <h1>{portfolio.name}</h1>
            <p className={portfolio.relativeReturn >= 0 ? 'positive' : 'negative'}>
              {t('relativeReturn')}: {portfolio.relativeReturn.toFixed(2)}%
            </p>
          </div>
          <button onClick={backToList} className="back-btn">
            ← {t('backToList')}
          </button>
        </div>

        <div className="portfolio-section">
          <h2>{t('portfolioDetails')}</h2>
          <p><strong>{t('tradingStrategy')}:</strong> {portfolio.strategy || t('noStrategy')}</p>
          <p>
            <strong>{t('visibility')}:</strong> 
            {portfolio.visibility === 'public' ? t('public') : t('private')}
          </p>
          <p><strong>{t('created')}:</strong> {new Date(portfolio.createdAt).toLocaleDateString()}</p>
        </div>
        
        {/* Add Trade Form */}
        <div className="portfolio-section">
          <h2>{t('addNewTrade')}</h2>
          <div className="form-group">
            <label>{t('symbol')}</label>
            <input
              type="text"
              placeholder={t('symbolPlaceholder')}
              value={newTrade.symbol}
              onChange={(e) => setNewTrade({...newTrade, symbol: e.target.value.toUpperCase()})}
            />
          </div>
          
          <div className="form-group">
            <label>{t('quantity')}</label>
            <input
              type="number"
              placeholder={t('quantity')}
              value={newTrade.quantity || ''}
              onChange={(e) => setNewTrade({...newTrade, quantity: parseInt(e.target.value) || 0})}
            />
          </div>
          
          <div className="form-group">
            <label>{t('price')}</label>
            <input
              type="number"
              placeholder={t('price')}
              value={newTrade.price || ''}
              onChange={(e) => setNewTrade({...newTrade, price: parseFloat(e.target.value) || 0})}
            />
          </div>
          
          <div className="form-group">
            <label>{t('tradeType')}</label>
            <select
              value={newTrade.type}
              onChange={(e) => setNewTrade({
                ...newTrade, 
                type: e.target.value as 'buy' | 'sell'
              })}
            >
              <option value="buy">{t('buy')}</option>
              <option value="sell">{t('sell')}</option>
            </select>
          </div>
          
          <button onClick={addTrade}>{t('addTrade')}</button>
        </div>
        
        {/* Trades List */}
        <div className="portfolio-section">
          <h2>{t('trades')}</h2>
          {trades.length === 0 ? (
            <p>{t('noTrades')}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('symbol')}</th>
                  <th>{t('type')}</th>
                  <th>{t('quantity')}</th>
                  <th>{t('price')}</th>
                  <th>{t('date')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(trade => (
                  <tr key={trade.id}>
                    <td>{trade.symbol}</td>
                    <td className={trade.type === 'buy' ? 'positive' : 'negative'}>
                      {trade.type === 'buy' ? t('buy').toUpperCase() : t('sell').toUpperCase()}
                    </td>
                    <td>{trade.quantity}</td>
                    <td>${trade.price.toFixed(2)}</td>
                    <td>{new Date(trade.date).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => deleteTrade(trade.id!)}
                        className="delete-btn"
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Navigation />
      
      <div className="container portfolio-container">
        {currentView === ViewType.LIST && renderPortfolioList()}
        {currentView === ViewType.CREATE && renderCreatePortfolio()}
        {currentView === ViewType.DETAIL && renderPortfolioDetail()}
      </div>
    </div>
  );
};

export default Portfolio; 