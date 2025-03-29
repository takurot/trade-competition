import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 英語のリソース
const enResources = {
  translation: {
    // 共通
    "appName": "Day Trading Competition",
    "appDescription": "Create and manage your trading portfolio, compete with others, and track your performance.",
    "loading": "Loading...",
    "signIn": "Sign in with Google",
    "signOut": "Sign Out",
    "portfolio": "Portfolio",
    "leaderboard": "Leaderboard",
    "home": "Home",
    
    // 認証画面
    "welcomeTitle": "Day Trading Competition",
    "welcomeMessage": "Create and manage your trading portfolio, compete with others, and track your performance.",
    
    // ポートフォリオ画面
    "portfolioTitle": "Trading Portfolios",
    "selectPortfolio": "Select a portfolio",
    "createPortfolio": "Create New Portfolio",
    "portfolioName": "Portfolio Name",
    "tradingStrategy": "Trading Strategy",
    "strategyPlaceholder": "Describe your trading strategy",
    "visibility": "Visibility",
    "private": "Private",
    "public": "Public (visible on leaderboard)",
    "createButton": "Create Portfolio",
    "portfolioPerformance": "Portfolio Performance",
    "relativeReturn": "Relative Return",
    "addNewTrade": "Add New Trade",
    "symbol": "Symbol",
    "symbolPlaceholder": "Symbol (e.g., AAPL)",
    "quantity": "Quantity",
    "price": "Price per Share",
    "tradeType": "Trade Type",
    "buy": "Buy",
    "sell": "Sell",
    "addTrade": "Add Trade",
    "trades": "Trades",
    "noTrades": "No trades recorded yet.",
    "type": "Type",
    "date": "Date",
    "actions": "Actions",
    "delete": "Delete",
    "backToList": "Back to List",
    "portfolioDetails": "Portfolio Details",
    "noStrategy": "No strategy provided",
    "created": "Created",
    "noPortfolios": "No portfolios yet. Create your first portfolio!",
    "portfolioNotFound": "Portfolio not found",
    "deletePortfolio": "Delete Portfolio",
    "deleteConfirmTitle": "Delete Portfolio",
    "deleteConfirmMessage": "Are you sure you want to delete this portfolio? This action cannot be undone and all trades will be deleted.",
    "cancel": "Cancel",
    
    // リーダーボード画面
    "leaderboardTitle": "Trading Competition Leaderboard",
    "noPublicPortfolios": "No public portfolios available yet.",
    "rank": "Rank",
    "trader": "Trader",
    "return": "Return",
    "strategy": "Strategy",
    
    // ホーム画面と大会参加
    "availableCompetitions": "Available Competitions",
    "oneDayCompetition": "1 Day Quick Challenge",
    "threeDayCompetition": "3 Days Standard Challenge",
    "fiveDayCompetition": "5 Days Pro Challenge",
    "oneDayCompetitionDesc": "Test your day trading skills in this fast-paced one-day competition!",
    "threeDayCompetitionDesc": "A balanced competition over three days to showcase your trading strategy.",
    "fiveDayCompetitionDesc": "The professional challenge - prove your trading prowess over a full trading week.",
    "enterCompetition": "Enter Competition",
    "selectPortfolioTitle": "Select Portfolio",
    "selectPortfolioMessage": "Choose a portfolio to enter this competition:",
    "joined": "Joined",
    "participating": "Participating with",
    "alreadyJoined": "You have already joined this competition",
    "selectPortfolioFirst": "Please select a portfolio first",
    "joinSuccess": "Successfully joined the competition!",
    "joinError": "There was an error joining the competition",
    "join": "Join",
    
    // 言語設定
    "language": "Language",
    "english": "English",
    "japanese": "日本語"
  }
};

// 日本語のリソース
const jaResources = {
  translation: {
    // 共通
    "appName": "デイトレード競争",
    "appDescription": "取引ポートフォリオを作成・管理し、他のユーザーと競い、パフォーマンスを追跡します。",
    "loading": "読み込み中...",
    "signIn": "Googleでログイン",
    "signOut": "ログアウト",
    "portfolio": "ポートフォリオ",
    "leaderboard": "ランキング",
    "home": "ホーム",
    
    // 認証画面
    "welcomeTitle": "デイトレード競争",
    "welcomeMessage": "取引ポートフォリオを作成・管理し、他のユーザーと競い、パフォーマンスを追跡します。",
    
    // ポートフォリオ画面
    "portfolioTitle": "取引ポートフォリオ一覧",
    "selectPortfolio": "ポートフォリオを選択",
    "createPortfolio": "新規ポートフォリオ作成",
    "portfolioName": "ポートフォリオ名",
    "tradingStrategy": "取引戦略",
    "strategyPlaceholder": "あなたの取引戦略を説明してください",
    "visibility": "公開設定",
    "private": "非公開",
    "public": "公開（ランキングに表示）",
    "createButton": "ポートフォリオを作成",
    "portfolioPerformance": "ポートフォリオのパフォーマンス",
    "relativeReturn": "相対リターン",
    "addNewTrade": "新規取引追加",
    "symbol": "銘柄",
    "symbolPlaceholder": "銘柄（例：AAPL）",
    "quantity": "数量",
    "price": "価格",
    "tradeType": "取引タイプ",
    "buy": "買い",
    "sell": "売り",
    "addTrade": "取引追加",
    "trades": "取引履歴",
    "noTrades": "まだ取引がありません。",
    "type": "タイプ",
    "date": "日付",
    "actions": "操作",
    "delete": "削除",
    "backToList": "一覧に戻る",
    "portfolioDetails": "ポートフォリオ詳細",
    "noStrategy": "戦略が設定されていません",
    "created": "作成日",
    "noPortfolios": "ポートフォリオがまだありません。最初のポートフォリオを作成しましょう！",
    "portfolioNotFound": "ポートフォリオが見つかりません",
    "deletePortfolio": "ポートフォリオを削除",
    "deleteConfirmTitle": "ポートフォリオの削除",
    "deleteConfirmMessage": "このポートフォリオを削除してもよろしいですか？この操作は取り消せず、すべての取引も削除されます。",
    "cancel": "キャンセル",
    
    // リーダーボード画面
    "leaderboardTitle": "デイトレード競争ランキング",
    "noPublicPortfolios": "公開ポートフォリオがまだありません。",
    "rank": "順位",
    "trader": "トレーダー",
    "return": "リターン",
    "strategy": "戦略",
    
    // ホーム画面と大会参加
    "availableCompetitions": "参加可能な大会",
    "oneDayCompetition": "1日間クイックチャレンジ",
    "threeDayCompetition": "3日間スタンダードチャレンジ",
    "fiveDayCompetition": "5日間プロチャレンジ",
    "oneDayCompetitionDesc": "この短期間の1日チャレンジであなたのデイトレードスキルをテスト！",
    "threeDayCompetitionDesc": "あなたの取引戦略を披露するための3日間の本格的な大会。",
    "fiveDayCompetitionDesc": "プロフェッショナルチャレンジ - 1週間の取引でトレードの腕前を証明しましょう。",
    "enterCompetition": "大会に参加",
    "selectPortfolioTitle": "ポートフォリオを選択",
    "selectPortfolioMessage": "この大会に参加するポートフォリオを選択してください：",
    "joined": "参加中",
    "participating": "参加中のポートフォリオ",
    "alreadyJoined": "この大会には既に参加しています",
    "selectPortfolioFirst": "先にポートフォリオを選択してください",
    "joinSuccess": "大会への参加が完了しました！",
    "joinError": "大会への参加中にエラーが発生しました",
    "join": "参加する",
    
    // 言語設定
    "language": "言語",
    "english": "English",
    "japanese": "日本語"
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: enResources,
      ja: jaResources
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false // リアクトは既にXSSを防いでいるため
    }
  });

export default i18n; 