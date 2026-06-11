import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

// Lazy-loaded routes
const Home = lazy(() => import('@/pages/Home'));
const Players = lazy(() => import('@/pages/Players'));
const Draft = lazy(() => import('@/pages/Draft'));
const CoinToss = lazy(() => import('@/pages/CoinToss'));
const LiveScorer = lazy(() => import('@/pages/LiveScorer'));
const Scorecard = lazy(() => import('@/pages/Scorecard'));
const History = lazy(() => import('@/pages/History'));
const Profile = lazy(() => import('@/pages/Profile'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-crease-line border-t-lime-shot animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg">🏏</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/draft" element={<Draft />} />
          <Route path="/toss/:matchId" element={<CoinToss />} />
          <Route path="/live/:matchId" element={<LiveScorer />} />
          <Route path="/scorecard/:matchId" element={<Scorecard />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
