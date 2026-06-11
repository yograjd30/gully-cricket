import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Player, CreatePlayerPayload, PlayerStats } from '@/types/player';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export function usePlayers() {
  return useQuery<Player[]>({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/players') as unknown as ApiResponse<Player[]>;
      return res.data;
    },
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePlayerPayload) => {
      const res = await api.post('/players', payload) as unknown as ApiResponse<Player>;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CreatePlayerPayload> & { id: string }) => {
      const res = await api.patch(`/players/${id}`, payload) as unknown as ApiResponse<Player>;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/players/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function usePlayerStats(playerId: string | null) {
  return useQuery<PlayerStats>({
    queryKey: ['playerStats', playerId],
    queryFn: async () => {
      const res = await api.get(`/players/${playerId}/stats`) as unknown as ApiResponse<PlayerStats>;
      return res.data;
    },
    enabled: !!playerId,
  });
}

export interface Team {
  _id: string;
  name: string;
  color: string;
  players: (string | Player)[];
}

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/teams') as unknown as ApiResponse<Team[]>;
      return res.data;
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; color: string; players: string[] }) => {
      const res = await api.post('/teams', payload) as unknown as ApiResponse<Team>;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
