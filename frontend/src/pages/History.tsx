import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMatches } from '@/hooks/useMatch';
import { History as HistoryIcon, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function History() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMatches(page);

  const matches = data?.matches || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-barlow font-bold text-3xl text-off-white flex items-center gap-3">
          <HistoryIcon size={28} className="text-gold-bail" />
          Match History
        </h1>
        <p className="text-muted-text text-sm mt-1">
          {pagination?.total || 0} {(pagination?.total || 0) === 1 ? 'match' : 'matches'} played
        </p>
      </div>

      {/* Match list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-text">Loading matches...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl">🏟️</div>
          <h3 className="font-barlow font-bold text-xl text-off-white">No matches yet</h3>
          <p className="text-muted-text text-sm">Start a match and it'll show up here.</p>
          <Link to="/draft" className="inline-flex gully-btn-primary rounded-xl">
            Start a Match
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, i) => (
            <motion.div
              key={match._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={match.status === 'completed' ? `/scorecard/${match._id}` : `/live/${match._id}`}
                className="gully-card block group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Teams */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: match.teamA.color }} />
                        <span className="font-barlow font-bold text-lg text-off-white">{match.teamA.name}</span>
                      </div>
                      <span className="text-muted-text text-sm">vs</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: match.teamB.color }} />
                        <span className="font-barlow font-bold text-lg text-off-white">{match.teamB.name}</span>
                      </div>
                    </div>

                    {/* Result */}
                    <div className="flex items-center gap-3 mt-1.5">
                      {match.status === 'completed' && match.result ? (
                        <span className="text-sm text-gold-bail font-medium">
                          {match.result.winner === 'teamA' ? match.teamA.name : match.teamB.name} {match.result.margin}
                        </span>
                      ) : (
                        <span className="text-xs text-lime-shot font-mono uppercase px-2 py-0.5 bg-lime-shot/10 rounded">
                          {match.status === 'toss' ? 'Toss' : match.status === 'innings1' ? 'Live — 1st Inn' : 'Live — 2nd Inn'}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-text font-mono flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(match.matchDate).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-muted-text font-mono">{match.totalOvers}ov</span>
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-muted-text group-hover:text-lime-shot transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="gully-btn-ghost rounded-lg disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-muted-text font-mono">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="gully-btn-ghost rounded-lg disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
