import { getDatabase } from '../database';

export interface UserActivity {
  id: string;
  userId: string;
  actionType: string;
  actionData: any;
  createdAt: number;
}

export const logUserActivity = async (
  userId: string,
  actionType: string,
  actionData?: any
): Promise<void> => {
  const db = getDatabase();
  
  const id = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const activity = {
    id,
    userId,
    actionType,
    actionData,
    createdAt: Date.now(),
  };
  
  db.activities.set(id, activity);
  
  console.log('[ActivityService] Logged user activity:', actionType, userId);
};

export const getUserActivity = async (userId: string, limit = 50): Promise<UserActivity[]> => {
  const db = getDatabase();
  
  const allActivities = Array.from(db.activities.values())
    .filter(activity => activity.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
  
  return allActivities;
};

export const getAllUserActivity = async (limit = 100): Promise<UserActivity[]> => {
  const db = getDatabase();
  
  const allActivities = Array.from(db.activities.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
  
  return allActivities;
};
