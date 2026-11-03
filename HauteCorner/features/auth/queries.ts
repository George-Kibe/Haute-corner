import { useMutation, useQuery } from '@tanstack/react-query';

import { authRequest, meQueryKey, useSession } from '@/features/auth/session';
import type { ProfileChanges, User } from '@/features/auth/types';
import { queryClient } from '@/lib/query-client';

export function useMe() {
  const signedIn = useSession((state) => state.status === 'signedIn');
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async ({ signal }) => (await authRequest<User>('/me', { signal })).data,
    enabled: signedIn,
  });
}

export function useUpdateMe() {
  return useMutation({
    mutationFn: async (changes: ProfileChanges) =>
      (await authRequest<User>('/me', { method: 'PATCH', body: changes })).data,
    onSuccess: (user) => queryClient.setQueryData(meQueryKey, user),
  });
}
