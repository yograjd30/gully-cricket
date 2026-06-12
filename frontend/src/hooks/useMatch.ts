import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Match, MatchListItem } from '@/types/match';
import type { DeliveryPayload, ScoringResponse } from '@/types/scoring';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface MatchListResponse {
  matches: MatchListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useMatches(page = 1) {
  return useQuery<MatchListResponse>({
    queryKey: ['matches', page],
    queryFn: async () => {
      const res = await api.get(`/matches?page=${page}&limit=10`) as unknown as ApiResponse<MatchListResponse>;
      return res.data;
    },
  });
}

export function useMatch(matchId: string | null) {
  return useQuery<Match>({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const res = await api.get(`/matches/${matchId}`) as unknown as ApiResponse<Match>;
      return res.data;
    },
    enabled: !!matchId,
    refetchInterval: false,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      teamA: { name: string; color?: string; players?: string[]; teamId?: string };
      teamB: { name: string; color?: string; players?: string[]; teamId?: string };
      totalOvers: number;
      venue?: string;
      rules?: Partial<Match['rules']>;
    }) => {
      const res = await api.post('/matches', payload) as unknown as ApiResponse<Match>;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useRecordToss() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, winner, decision }: {
      matchId: string;
      winner: 'teamA' | 'teamB';
      decision: 'bat' | 'field';
    }) => {
      const res = await api.patch(`/matches/${matchId}/toss`, { winner, decision }) as unknown as ApiResponse<Match>;
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['match', vars.matchId] });
    },
  });
}

export function useRecordBall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, delivery }: { matchId: string; delivery: DeliveryPayload }) => {
      const res = await api.post(`/scoring/${matchId}/ball`, delivery) as unknown as ApiResponse<ScoringResponse>;
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['match', vars.matchId] });
    },
  });
}

export function useUndoBall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      const res = await api.delete(`/scoring/${matchId}/ball`) as unknown as ApiResponse<ScoringResponse>;
      return res.data;
    },
    onSuccess: (_, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
    },
  });
}

export function useCompleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      const res = await api.post(`/scoring/${matchId}/complete`) as unknown as ApiResponse<Match>;
      return res.data;
    },
    onSuccess: (_, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useUpdateMatchStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, status }: { matchId: string; status: string }) => {
      const res = await api.patch(`/matches/${matchId}/status`, { status }) as unknown as ApiResponse<Match>;
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['match', vars.matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      const res = await api.delete(`/matches/${matchId}`) as unknown as ApiResponse<{ success: boolean }>;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}
