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

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
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
          portfolios.push({ 
            id: doc.id, 
            ...doc.data() as Omit<Portfolio, 'id'> 
          });
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
        
        setLeaderboard(portfoliosWithUserDetails);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  return (
    <div>
      <Navigation />
      
      <div className="container leaderboard-container">
        <h1>{t('leaderboardTitle')}</h1>
        
        {loading ? (
          <div>{t('loading')}</div>
        ) : leaderboard.length === 0 ? (
          <div className="portfolio-section">
            <p>{t('noPublicPortfolios')}</p>
          </div>
        ) : (
          <div className="portfolio-section">
            <table>
              <thead>
                <tr>
                  <th className="rank">{t('rank')}</th>
                  <th>{t('trader')}</th>
                  <th>{t('portfolio')}</th>
                  <th>{t('return')}</th>
                  <th>{t('strategy')}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((portfolio, index) => (
                  <tr key={portfolio.id}>
                    <td className="rank">{index + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {portfolio.userAvatar && (
                          <img 
                            src={portfolio.userAvatar} 
                            alt={portfolio.userName}
                            style={{ width: 30, height: 30, borderRadius: '50%', marginRight: 8 }}
                          />
                        )}
                        {portfolio.userName}
                      </div>
                    </td>
                    <td>{portfolio.name}</td>
                    <td className={portfolio.relativeReturn >= 0 ? 'positive' : 'negative'}>
                      {portfolio.relativeReturn >= 0 ? '+' : ''}{portfolio.relativeReturn.toFixed(2)}%
                    </td>
                    <td>{portfolio.strategy}</td>
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