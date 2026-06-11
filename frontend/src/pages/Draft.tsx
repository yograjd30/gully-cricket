import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayers, useTeams, useCreateTeam } from '@/hooks/usePlayers';
import { useCreateMatch } from '@/hooks/useMatch';
import TeamSlot from '@/components/draft/TeamSlot';
import type { Player } from '@/types/player';
import { Crosshair, ChevronRight, Shuffle, Settings2, Download, Save } from 'lucide-react';

export default function Draft() {
  const navigate = useNavigate();
  const { data: allPlayers = [] } = usePlayers();
  const { data: savedTeams = [] } = useTeams();
  const saveTeam = useCreateTeam();
  const createMatch = useCreateMatch();

  const [teamAName, setTeamAName] = useState('Team Alpha');
  const [teamBName, setTeamBName] = useState('Team Bravo');
  const [teamAColor, setTeamAColor] = useState('#A3E635');
  const [teamBColor, setTeamBColor] = useState('#38BDF8');
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [totalOvers, setTotalOvers] = useState(5);
  const [showRules, setShowRules] = useState(false);
  const [boundaryOut, setBoundaryOut] = useState(true);
  const [venue, setVenue] = useState('');

  // Players not yet assigned
  const assignedIds = new Set([
    ...teamAPlayers.map((p) => p._id),
    ...teamBPlayers.map((p) => p._id),
  ]);
  const available = allPlayers.filter((p) => !assignedIds.has(p._id));

  const addToTeam = (player: Player, team: 'A' | 'B') => {
    if (team === 'A' && teamAPlayers.length < 11) {
      setTeamAPlayers((prev) => [...prev, player]);
    } else if (team === 'B' && teamBPlayers.length < 11) {
      setTeamBPlayers((prev) => [...prev, player]);
    }
  };

  const removeFromA = (id: string) => setTeamAPlayers((prev) => prev.filter((p) => p._id !== id));
  const removeFromB = (id: string) => setTeamBPlayers((prev) => prev.filter((p) => p._id !== id));

  const handleLoadTeam = (teamId: string, slot: 'A' | 'B') => {
    const selectedTeam = savedTeams.find((t) => t._id === teamId);
    if (!selectedTeam) return;

    const playerIds = selectedTeam.players.map((p) => (typeof p === 'string' ? p : p._id));
    const playersToLoad = allPlayers.filter((p) => playerIds.includes(p._id));

    if (slot === 'A') {
      setTeamAName(selectedTeam.name);
      setTeamAColor(selectedTeam.color);
      setTeamAPlayers(playersToLoad);
    } else {
      setTeamBName(selectedTeam.name);
      setTeamBColor(selectedTeam.color);
      setTeamBPlayers(playersToLoad);
    }
  };

  const handleSaveTeam = async (slot: 'A' | 'B') => {
    const name = slot === 'A' ? teamAName : teamBName;
    const color = slot === 'A' ? teamAColor : teamBColor;
    const players = slot === 'A' ? teamAPlayers : teamBPlayers;

    if (players.length < 2) {
      alert('Add at least 2 players to save a team!');
      return;
    }

    try {
      await saveTeam.mutateAsync({
        name,
        color,
        players: players.map((p) => p._id),
      });
      alert(`Team "${name}" saved successfully!`);
    } catch (err) {
      console.error('Failed to save team:', err);
      alert('Failed to save team. Make sure you are logged in!');
    }
  };

  const randomDraft = () => {
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
    const half = Math.ceil(shuffled.length / 2);
    setTeamAPlayers(shuffled.slice(0, Math.min(half, 11)));
    setTeamBPlayers(shuffled.slice(half, Math.min(half + 11, shuffled.length)));
  };

  const canProceed = teamAPlayers.length >= 2 && teamBPlayers.length >= 2 && teamAName && teamBName;

  const handleProceed = async () => {
    try {
      const match = await createMatch.mutateAsync({
        teamA: {
          name: teamAName,
          color: teamAColor,
          players: teamAPlayers.map((p) => p._id),
        },
        teamB: {
          name: teamBName,
          color: teamBColor,
          players: teamBPlayers.map((p) => p._id),
        },
        totalOvers,
        venue,
        rules: {
          boundaryOut,
          offsideWide: { runs: 0, rebowl: true },
          legsideWide: { runs: 1, rebowl: true },
          noBall: { runs: 1, freehit: false },
        },
      });
      navigate(`/toss/${match._id}`);
    } catch (err) {
      console.error('Failed to create match:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-barlow font-bold text-3xl text-off-white flex items-center gap-3">
            <Crosshair size={28} className="text-lime-shot" />
            Team Draft
          </h1>
          <p className="text-muted-text text-sm mt-1">Tap a player to assign them to a team</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {savedTeams.length > 0 && (
            <div className="flex items-center gap-1.5 bg-pavilion-dark border border-crease-line rounded-xl px-2 py-1.5">
              <Download size={14} className="text-sky-six" />
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const [teamId, slot] = e.target.value.split(':');
                    handleLoadTeam(teamId, slot as 'A' | 'B');
                    e.target.value = '';
                  }
                }}
                className="bg-transparent text-xs text-off-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-pavilion-dark">Load Saved Team...</option>
                {savedTeams.map((t) => (
                  <optgroup key={t._id} label={t.name} className="bg-pavilion-dark">
                    <option value={`${t._id}:A`}>Load as Team A</option>
                    <option value={`${t._id}:B`}>Load as Team B</option>
                  </optgroup>
                ))}
              </select>
            </div>
          )}
          {allPlayers.length >= 4 && (
            <button onClick={randomDraft} className="gully-btn-ghost rounded-xl text-xs py-2">
              <Shuffle size={14} className="mr-1.5" />
              Random
            </button>
          )}
        </div>
      </div>

      {/* Match Setup */}
      <div className="gully-card flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-text">Overs:</label>
          <select
            value={totalOvers}
            onChange={(e) => setTotalOvers(Number(e.target.value))}
            className="bg-pitch-black border border-crease-line rounded-lg px-3 py-2 text-off-white text-sm focus:outline-none focus:border-lime-shot/50"
          >
            {[2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((o) => (
              <option key={o} value={o}>{o} overs</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-text">Venue:</label>
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g., Parking Lot Ground"
            className="bg-pitch-black border border-crease-line rounded-lg px-3 py-2 text-off-white text-sm placeholder-muted-text/50 focus:outline-none focus:border-lime-shot/50 w-48"
          />
        </div>
        <button
          onClick={() => setShowRules(!showRules)}
          className="gully-btn-ghost rounded-lg text-sm"
        >
          <Settings2 size={16} className="mr-1" />
          Rules
        </button>
      </div>

      {/* Rules panel */}
      {showRules && (
        <div className="gully-card animate-slide-up space-y-3">
          <h3 className="font-barlow font-bold text-lg text-off-white">Gully Rules</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={boundaryOut}
              onChange={(e) => setBoundaryOut(e.target.checked)}
              className="w-4 h-4 rounded border-crease-line text-lime-shot focus:ring-lime-shot/50 bg-pitch-black"
            />
            <div>
              <span className="text-sm text-off-white font-medium">Boundary Out (Six = OUT)</span>
              <p className="text-xs text-muted-text">Hit a six and you're dismissed. Classic gully.</p>
            </div>
          </label>
          <div className="text-xs text-muted-text border-t border-crease-line/50 pt-3 space-y-1">
            <p>• Offside Wide: 0 runs, re-bowl</p>
            <p>• Legside Wide: 1 run, re-bowl</p>
            <p>• No Ball: 1 run penalty, re-bowl</p>
          </div>
        </div>
      )}

      {/* Available Players */}
      {available.length > 0 && (
        <div>
          <h3 className="font-semibold text-off-white text-sm mb-3">
            Available Players ({available.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {available.map((player) => (
              <div key={player._id} className="flex items-center gap-1">
                <button
                  onClick={() => addToTeam(player, 'A')}
                  className="px-1.5 py-1 rounded-l-lg text-[10px] font-bold border border-crease-line hover:bg-lime-shot/20 transition-colors"
                  style={{ color: teamAColor }}
                  title={`Add to ${teamAName}`}
                >
                  A
                </button>
                <span className="px-3 py-1.5 bg-pavilion-dark border-y border-crease-line text-sm text-off-white">
                  {player.avatar || '🏏'} {player.name}
                </span>
                <button
                  onClick={() => addToTeam(player, 'B')}
                  className="px-1.5 py-1 rounded-r-lg text-[10px] font-bold border border-crease-line hover:bg-sky-six/20 transition-colors"
                  style={{ color: teamBColor }}
                  title={`Add to ${teamBName}`}
                >
                  B
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allPlayers.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="text-5xl">👥</div>
          <p className="text-muted-text">
            No players in your pool yet.{' '}
            <a href="/players" className="text-lime-shot hover:underline">Add some first</a>.
          </p>
        </div>
      )}

      {/* Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <TeamSlot
            teamName={teamAName}
            color={teamAColor}
            players={teamAPlayers}
            onRemove={removeFromA}
            onNameChange={setTeamAName}
            onColorChange={setTeamAColor}
          />
          {teamAPlayers.length >= 2 && (
            <button
              onClick={() => handleSaveTeam('A')}
              disabled={saveTeam.isPending}
              className="w-full py-2 bg-pavilion-dark border border-crease-line rounded-xl text-xs text-muted-text hover:text-lime-shot hover:border-lime-shot/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <Save size={12} />
              {saveTeam.isPending ? 'Saving...' : 'Save Roster as Saved Team'}
            </button>
          )}
        </div>
        <div className="space-y-2">
          <TeamSlot
            teamName={teamBName}
            color={teamBColor}
            players={teamBPlayers}
            onRemove={removeFromB}
            onNameChange={setTeamBName}
            onColorChange={setTeamBColor}
          />
          {teamBPlayers.length >= 2 && (
            <button
              onClick={() => handleSaveTeam('B')}
              disabled={saveTeam.isPending}
              className="w-full py-2 bg-pavilion-dark border border-crease-line rounded-xl text-xs text-muted-text hover:text-sky-six hover:border-sky-six/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <Save size={12} />
              {saveTeam.isPending ? 'Saving...' : 'Save Roster as Saved Team'}
            </button>
          )}
        </div>
      </div>

      {/* Proceed button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleProceed}
          disabled={!canProceed || createMatch.isPending}
          className="gully-btn-primary text-lg px-10 py-4 rounded-2xl group"
        >
          {createMatch.isPending ? 'Creating Match...' : 'Proceed to Toss'}
          <ChevronRight size={22} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
