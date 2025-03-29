import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig.ts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from './Navigation.tsx';
import '../styles.css';

// 大会の種類
enum CompetitionType {
  ONE_DAY = '1day',
  THREE_DAYS = '3days',
  FIVE_DAYS = '5days'
}

// 大会情報の型
interface Competition {
  id: string;
  type: CompetitionType;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  description: string;
}

// ポートフォリオの型
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

// 参加履歴の型
interface Participation {
  competitionId: string;
  portfolioId: string;
  userId: string;
  joinedAt: Date;
  initialReturn: number;
  finalReturn?: number;
}

const Home: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // 進行中の大会
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  
  // ユーザーのポートフォリオ
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  
  // 選択中の大会とポートフォリオ
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  
  // ポートフォリオ選択モーダルの表示状態
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  
  // ユーザーの参加履歴
  const [participations, setParticipations] = useState<Record<string, string>>({});
  
  // 成功/エラーメッセージ
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // ユーザーとポートフォリオの読み込み
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/');
      return;
    }
    
    // ポートフォリオを取得
    const fetchPortfolios = async () => {
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
    
    // 大会情報を取得（サンプルデータ - 実際はFirestoreから取得）
    const fetchCompetitions = async () => {
      // 現在の日付
      const now = new Date();
      
      // サンプル大会データ
      const sampleCompetitions: Competition[] = [
        {
          id: '1day-comp',
          type: CompetitionType.ONE_DAY,
          name: t('oneDayCompetition'),
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          status: 'active',
          description: t('oneDayCompetitionDesc')
        },
        {
          id: '3days-comp',
          type: CompetitionType.THREE_DAYS,
          name: t('threeDayCompetition'),
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
          status: 'active',
          description: t('threeDayCompetitionDesc')
        },
        {
          id: '5days-comp',
          type: CompetitionType.FIVE_DAYS,
          name: t('fiveDayCompetition'),
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
          status: 'active',
          description: t('fiveDayCompetitionDesc')
        }
      ];
      
      setCompetitions(sampleCompetitions);
    };
    
    // ユーザーの参加履歴を取得
    const fetchParticipations = async () => {
      const participationsQuery = query(
        collection(db, 'participations'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(participationsQuery);
      const participationsMap: Record<string, string> = {};
      
      querySnapshot.forEach((doc) => {
        const participation = doc.data() as Participation;
        participationsMap[participation.competitionId] = participation.portfolioId;
      });
      
      setParticipations(participationsMap);
    };
    
    fetchPortfolios();
    fetchCompetitions();
    fetchParticipations();
  }, [user, loading, navigate, t]);

  // 大会エントリーボタンのクリックハンドラ
  const handleCompetitionClick = (competitionId: string) => {
    if (participations[competitionId]) {
      // すでに参加している場合はメッセージを表示
      setMessage({
        text: t('alreadyJoined'),
        type: 'error'
      });
      return;
    }
    
    setSelectedCompetition(competitionId);
    setShowPortfolioModal(true);
  };

  // ポートフォリオ選択のハンドラ
  const handlePortfolioSelect = (portfolioId: string) => {
    setSelectedPortfolio(portfolioId);
  };

  // 大会に参加する
  const joinCompetition = async () => {
    if (!selectedCompetition || !selectedPortfolio || !user) {
      setMessage({
        text: t('selectPortfolioFirst'),
        type: 'error'
      });
      return;
    }
    
    try {
      // 選択されたポートフォリオの情報を取得
      const portfolioRef = doc(db, 'portfolios', selectedPortfolio);
      const portfolioSnap = await getDoc(portfolioRef);
      
      if (!portfolioSnap.exists()) {
        throw new Error('Portfolio not found');
      }
      
      const portfolioData = portfolioSnap.data() as Portfolio;
      
      // 参加記録を保存
      await addDoc(collection(db, 'participations'), {
        competitionId: selectedCompetition,
        portfolioId: selectedPortfolio,
        userId: user.uid,
        joinedAt: new Date(),
        initialReturn: portfolioData.relativeReturn,
        finalReturn: null
      });
      
      // 参加情報を更新
      setParticipations({
        ...participations,
        [selectedCompetition]: selectedPortfolio
      });
      
      // モーダルを閉じる
      setShowPortfolioModal(false);
      setSelectedCompetition(null);
      setSelectedPortfolio(null);
      
      // 成功メッセージ
      setMessage({
        text: t('joinSuccess'),
        type: 'success'
      });
      
      // 数秒後にメッセージをクリア
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error joining competition:', error);
      setMessage({
        text: t('joinError'),
        type: 'error'
      });
    }
  };

  // モーダルをキャンセル
  const handleCancelModal = () => {
    setShowPortfolioModal(false);
    setSelectedCompetition(null);
    setSelectedPortfolio(null);
  };

  if (loading) return <div>{t('loading')}</div>;
  if (!user) return <div>Please sign in to continue</div>;

  return (
    <div>
      <Navigation />
      
      <div className="container home-container">
        <h1>{t('home')}</h1>
        
        {/* メッセージ表示 */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <div className="competitions-container">
          <h2>{t('availableCompetitions')}</h2>
          
          <div className="competitions-grid">
            {competitions.map(competition => {
              const isJoined = !!participations[competition.id];
              const joinedPortfolio = isJoined 
                ? portfolios.find(p => p.id === participations[competition.id]) 
                : null;
              
              return (
                <div key={competition.id} className="competition-card">
                  <h3>{competition.name}</h3>
                  <p className="competition-dates">
                    {new Date(competition.startDate).toLocaleDateString()} - {new Date(competition.endDate).toLocaleDateString()}
                  </p>
                  <p className="competition-description">{competition.description}</p>
                  
                  {isJoined ? (
                    <div className="joined-status">
                      <span className="joined-badge">{t('joined')}</span>
                      <p>{t('participating')}: {joinedPortfolio?.name}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleCompetitionClick(competition.id)}
                      className="join-btn"
                    >
                      {t('enterCompetition')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* ポートフォリオ選択モーダル */}
        {showPortfolioModal && (
          <div className="confirm-dialog-overlay">
            <div className="confirm-dialog portfolio-select-dialog">
              <h3>{t('selectPortfolioTitle')}</h3>
              <p>{t('selectPortfolioMessage')}</p>
              
              {portfolios.length === 0 ? (
                <p>{t('noPortfolios')}</p>
              ) : (
                <div className="portfolio-select-list">
                  {portfolios.map(portfolio => (
                    <div 
                      key={portfolio.id}
                      className={`portfolio-select-item ${selectedPortfolio === portfolio.id ? 'selected' : ''}`}
                      onClick={() => handlePortfolioSelect(portfolio.id!)}
                    >
                      <strong>{portfolio.name}</strong>
                      <span className={portfolio.relativeReturn >= 0 ? 'positive' : 'negative'}>
                        {portfolio.relativeReturn >= 0 ? '+' : ''}{portfolio.relativeReturn.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="confirm-dialog-buttons">
                <button onClick={handleCancelModal} className="cancel-btn">
                  {t('cancel')}
                </button>
                <button 
                  onClick={joinCompetition} 
                  className="join-btn"
                  disabled={!selectedPortfolio || portfolios.length === 0}
                >
                  {t('join')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 