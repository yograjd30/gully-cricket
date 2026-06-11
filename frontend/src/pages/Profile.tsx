import { User, LogIn, LogOut, TrendingUp, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

interface AuthUser {
  _id: string;
  displayName: string;
  email: string;
  avatar: string;
}

export default function Profile() {
  const { data: user } = useQuery<AuthUser | null>({
    queryKey: ['auth'],
    queryFn: async () => {
      const res = await api.get('/auth/me') as unknown as { success: boolean; data: AuthUser | null };
      return res.data;
    },
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await api.get('/stats/leaderboard') as unknown as {
        success: boolean;
        data: {
          topRunScorers: { playerId: string; runs: number; matches: number; playerName: string; playerAvatar: string }[];
          topWicketTakers: { playerId: string; wickets: number; matches: number; playerName: string; playerAvatar: string }[];
        };
      };
      return res.data;
    },
  });

  const handleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleLogout = async () => {
    await api.post('/auth/logout');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="font-barlow font-bold text-3xl text-off-white flex items-center gap-3">
        <User size={28} className="text-sky-six" />
        Profile
      </h1>

      {/* Auth card */}
      <div className="gully-card">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-14 h-14 rounded-full border-2 border-lime-shot/30" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-crease-line flex items-center justify-center text-xl font-barlow font-bold text-lime-shot">
                  {user.displayName.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-off-white text-lg">{user.displayName}</h3>
                <p className="text-sm text-muted-text">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="gully-btn-ghost rounded-xl text-sm">
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="text-5xl">👤</div>
            <div>
              <h3 className="font-barlow font-bold text-xl text-off-white">Guest Mode</h3>
              <p className="text-muted-text text-sm mt-1">
                Sign in to save your matches, players, and stats permanently.
              </p>
            </div>
            <button onClick={handleLogin} className="gully-btn-primary rounded-xl">
              <LogIn size={18} className="mr-2" />
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Scorers */}
        <div className="gully-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-lime-shot" />
            <h3 className="font-barlow font-bold text-lg text-off-white">Top Run Scorers</h3>
          </div>
          {leaderboard?.topRunScorers && leaderboard.topRunScorers.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.topRunScorers.slice(0, 5).map((entry, i) => (
                <div key={entry.playerId} className="flex items-center gap-3 py-2 border-b border-crease-line/20 last:border-0">
                  <span className={`font-barlow font-bold text-lg w-6 ${i === 0 ? 'text-gold-bail' : i === 1 ? 'text-off-white' : i === 2 ? 'text-sky-six' : 'text-muted-text'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">{entry.playerAvatar || '🏏'}</span>
                    <div className="truncate">
                      <span className="text-sm text-off-white font-medium block truncate">{entry.playerName}</span>
                      <span className="text-[10px] text-muted-text">{entry.matches} matches</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-lime-shot flex-shrink-0">{entry.runs} runs</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-text text-sm text-center py-4">No data yet</p>
          )}
        </div>

        {/* Top Wicket Takers */}
        <div className="gully-card">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} className="text-wicket-red" />
            <h3 className="font-barlow font-bold text-lg text-off-white">Top Wicket Takers</h3>
          </div>
          {leaderboard?.topWicketTakers && leaderboard.topWicketTakers.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.topWicketTakers.slice(0, 5).map((entry, i) => (
                <div key={entry.playerId} className="flex items-center gap-3 py-2 border-b border-crease-line/20 last:border-0">
                  <span className={`font-barlow font-bold text-lg w-6 ${i === 0 ? 'text-gold-bail' : i === 1 ? 'text-off-white' : i === 2 ? 'text-sky-six' : 'text-muted-text'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">{entry.playerAvatar || '🏏'}</span>
                    <div className="truncate">
                      <span className="text-sm text-off-white font-medium block truncate">{entry.playerName}</span>
                      <span className="text-[10px] text-muted-text">{entry.matches} matches</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-wicket-red flex-shrink-0">{entry.wickets} wkts</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-text text-sm text-center py-4">No data yet</p>
          )}
        </div>
      </div>

      {/* App info */}
      <div className="text-center py-8 space-y-2">
        <p className="font-barlow font-bold text-lg text-gradient-lime">Gully Cricket HQ</p>
        <p className="text-xs text-muted-text font-mono">Your Pitch. Your Rules. Your Records.</p>
        <p className="text-[10px] text-muted-text/50">v1.0.0</p>
      </div>
    </div>
  );
}
