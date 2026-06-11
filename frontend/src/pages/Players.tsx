import { useState } from 'react';
import { usePlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer } from '@/hooks/usePlayers';
import PlayerCard from '@/components/players/PlayerCard';
import PlayerForm from '@/components/players/PlayerForm';
import PlayerStats from '@/components/players/PlayerStats';
import type { Player, CreatePlayerPayload } from '@/types/player';
import { Plus, Search, Users } from 'lucide-react';

export default function Players() {
  const { data: players = [], isLoading } = usePlayers();
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();

  const [formOpen, setFormOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [statsPlayerId, setStatsPlayerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.nickname?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (data: CreatePlayerPayload) => {
    if (editPlayer) {
      await updatePlayer.mutateAsync({ id: editPlayer._id, ...data });
    } else {
      await createPlayer.mutateAsync(data);
    }
    setFormOpen(false);
    setEditPlayer(null);
  };

  const handleEdit = (player: Player) => {
    setEditPlayer(player);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this player from your squad?')) {
      await deletePlayer.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-barlow font-bold text-3xl text-off-white flex items-center gap-3">
            <Users size={28} className="text-lime-shot" />
            Player Pool
          </h1>
          <p className="text-muted-text text-sm mt-1">
            {players.length} player{players.length !== 1 ? 's' : ''} in your squad
          </p>
        </div>
        <button
          onClick={() => { setEditPlayer(null); setFormOpen(true); }}
          className="gully-btn-primary rounded-xl"
        >
          <Plus size={18} className="mr-2" />
          Add Player
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-pavilion-dark border border-crease-line text-off-white placeholder-muted-text/50 focus:outline-none focus:border-lime-shot/50 transition-all"
        />
      </div>

      {/* Player Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-text">Loading players...</div>
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl">🏏</div>
          <h3 className="font-barlow font-bold text-xl text-off-white">No players yet</h3>
          <p className="text-muted-text text-sm">Add your squad members to get started.</p>
          <button
            onClick={() => setFormOpen(true)}
            className="gully-btn-primary rounded-xl"
          >
            <Plus size={18} className="mr-2" />
            Add Your First Player
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player._id}
              player={player}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewStats={setStatsPlayerId}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <PlayerForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditPlayer(null); }}
        onSubmit={handleSubmit}
        editPlayer={editPlayer}
        isLoading={createPlayer.isPending || updatePlayer.isPending}
      />

      {/* Stats Modal */}
      <PlayerStats
        playerId={statsPlayerId}
        onClose={() => setStatsPlayerId(null)}
      />
    </div>
  );
}
