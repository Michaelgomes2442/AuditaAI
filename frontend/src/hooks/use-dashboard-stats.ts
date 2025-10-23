import useSWR from 'swr';

export interface DashboardStats {
  totalRecords: number;
  uniqueUsers: number;
  recentActivity: Array<{
    id: string;
    action: string;
    user: {
      name: string | null;
    } | null;
  }>;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useDashboardStats(refreshInterval = 5000) {
  return useSWR<DashboardStats>('/api/dashboard', fetcher, {
    refreshInterval,
    fallbackData: {
      totalRecords: 0,
      uniqueUsers: 0,
      recentActivity: []
    }
  });
}