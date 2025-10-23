export type Activity = {
  id: string;
  action: string;
  user?: {
    name: string;
  } | null;
}

export type Stats = {
  totalRecords: number;
  uniqueUsers: number;
  recentActivity: Activity[];
}