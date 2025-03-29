import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig.ts';
import { useTranslation } from 'react-i18next';
import Navigation from './Navigation.tsx';
import '../styles.css';

interface Portfolio {
  id: string;
  name: string;
  strategy: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  visibility: 'public' | 'private';
  relativeReturn: number;
  createdAt: Date;
  updatedAt: Date;
}

// デモデータ（データがない場合やテスト用）
const DEMO_PORTFOLIOS: Portfolio[] = [
  {
    id: 'demo1',
    name: 'Tech Growth',
    strategy: 'Invest in high-growth tech companies',
    userId: 'demo-user-1',
    userName: 'Elon Musk',
    userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    visibility: 'public',
    relativeReturn: 27.45,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: 'demo2',
    name: 'Value Investing',
    strategy: 'Focus on undervalued companies with strong fundamentals',
    userId: 'demo-user-2',
    userName: 'Warren Buffett',
    userAvatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    visibility: 'public',
    relativeReturn: 18.32,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: 'demo3',
    name: 'Market Movers',
    strategy: 'Day trade based on momentum and news',
    userId: 'demo-user-3',
    userName: 'Cathie Wood',
    userAvatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    visibility: 'public',
    relativeReturn: 15.87,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: 'demo4',
    name: 'Dividend Kings',
    strategy: 'Focus on stocks with high dividend yields',
    userId: 'demo-user-4',
    userName: 'Ray Dalio',
    userAvatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    visibility: 'public',
    relativeReturn: 8.92,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: 'demo5',
    name: 'Contrarian Strategy',
    strategy: 'Buy when others sell, sell when others buy',
    userId: 'demo-user-5',
    userName: 'Michael Burry',
    userAvatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    visibility: 'public',
    relativeReturn: -3.21,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [useDemoData, setUseDemoData] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        
        // Query for public portfolios, ordered by relative return (descending)
        const q = query(
          collection(db, 'portfolios'),
          where('visibility', '==', 'public'),
          orderBy('relativeReturn', 'desc'),
          limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        const portfolios: Portfolio[] = [];
        
        // Map through the results
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          portfolios.push({ 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
          } as Portfolio);
        });
        
        // For each portfolio, fetch the user's name and avatar
        const portfoliosWithUserDetails = await Promise.all(
          portfolios.map(async (portfolio) => {
            try {
              const userQuery = query(
                collection(db, 'users'),
                where('uid', '==', portfolio.userId)
              );
              
              const userSnapshot = await getDocs(userQuery);
              let userName = 'Anonymous';
              let userAvatar = '';
              
              userSnapshot.forEach((doc) => {
                const userData = doc.data();
                userName = userData.displayName || 'Anonymous';
                userAvatar = userData.photoURL || '';
              });
              
              return {
                ...portfolio,
                userName,
                userAvatar
              };
            } catch (error) {
              console.error('Error fetching user details:', error);
              return portfolio;
            }
          })
        );
        
        // データがない場合はデモデータを使用
        if (portfoliosWithUserDetails.length === 0) {
          console.log('No real portfolios found, using demo data');
          setUseDemoData(true);
          setLeaderboard(DEMO_PORTFOLIOS);
        } else {
          setLeaderboard(portfoliosWithUserDetails);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // エラー時もデモデータを表示
        setUseDemoData(true);
        setLeaderboard(DEMO_PORTFOLIOS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  const toggleDemoData = () => {
    setUseDemoData(!useDemoData);
    setLeaderboard(useDemoData ? [] : DEMO_PORTFOLIOS);
  };

  return (
    <div>
      <Navigation />
      
      <div className="container leaderboard-container">
        <div className="leaderboard-header">
          <h1>{t('leaderboardTitle')}</h1>
          <button 
            onClick={toggleDemoData} 
            className="toggle-demo-btn"
          >
            {useDemoData ? t('hideDemoData') : t('showDemoData')}
          </button>
        </div>
        
        {loading ? (
          <div className="loading-container">{t('loading')}</div>
        ) : leaderboard.length === 0 ? (
          <div className="portfolio-section empty-leaderboard">
            <p>{t('noPublicPortfolios')}</p>
            <button 
              onClick={() => setLeaderboard(DEMO_PORTFOLIOS)} 
              className="show-demo-btn"
            >
              {t('showDemoData')}
            </button>
          </div>
        ) : (
          <div className="leaderboard-section">
            {useDemoData && (
              <div className="demo-data-notice">
                <p>{t('demoDataNotice')}</p>
              </div>
            )}
            
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="rank-column">{t('rank')}</th>
                  <th className="trader-column">{t('trader')}</th>
                  <th className="portfolio-column">{t('portfolio')}</th>
                  <th className="return-column">{t('return')}</th>
                  <th className="strategy-column">{t('strategy')}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((portfolio, index) => (
                  <tr key={portfolio.id} className="leaderboard-row">
                    <td className="rank-column">
                      <div className="rank-badge">{index + 1}</div>
                    </td>
                    <td className="trader-column">
                      <div className="trader-info">
                        {portfolio.userAvatar && (
                          <img 
                            src={portfolio.userAvatar} 
                            alt={portfolio.userName}
                            className="trader-avatar"
                          />
                        )}
                        <span className="trader-name">{portfolio.userName}</span>
                      </div>
                    </td>
                    <td className="portfolio-column">{portfolio.name}</td>
                    <td className={`return-column ${portfolio.relativeReturn >= 0 ? 'positive' : 'negative'}`}>
                      {portfolio.relativeReturn >= 0 ? '+' : ''}{portfolio.relativeReturn.toFixed(2)}%
                    </td>
                    <td className="strategy-column">
                      <div className="strategy-text">{portfolio.strategy}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard; 