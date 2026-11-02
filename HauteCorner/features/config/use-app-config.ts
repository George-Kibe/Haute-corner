import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

export type AppConfig = {
  minimumAppVersion: string;
  cloudinaryCloudName: string;
};

export function useAppConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: async ({ signal }) => (await apiGet<AppConfig>('/config', { signal })).data,
    staleTime: 60 * 60 * 1000,
  });
}
