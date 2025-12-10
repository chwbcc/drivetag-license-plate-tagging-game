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
  
  await db.execute({
    sql: 'INSERT INTO activities (id, userId, actionType, actionData, createdAt) VALUES (?, ?, ?, ?, ?)',
    args: [
      id,
      userId,
      actionType,
      JSON.stringify(actionData || {}),
      Date.now()
    ]
  });
  
  console.log('[ActivityService] Logged user activity:', actionType, userId);
};

export const getUserActivity = async (userId: string, limit = 50): Promise<UserActivity[]> => {
  const db = getDatabase();
  
  const result = await db.execute({
    sql: 'SELECT * FROM activities WHERE userId = ? ORDER BY createdAt DESC LIMIT ?',
    args: [userId, limit]
  });
  
  const activities: UserActivity[] = result.rows.map((row: any) => ({
    id: row.id as string,
    userId: row.userId as string,
    actionType: row.actionType as string,
    actionData: JSON.parse(row.actionData as string),
    createdAt: row.createdAt as number,
  }));
  
  return activities;
};

export const getAllUserActivity = async (limit = 100): Promise<UserActivity[]> => {
  const db = getDatabase();
  
  const result = await db.execute({
    sql: 'SELECT * FROM activities ORDER BY createdAt DESC LIMIT ?',
    args: [limit]
  });
  
  const activities: UserActivity[] = result.rows.map((row: any) => ({
    id: row.id as string,
    userId: row.userId as string,
    actionType: row.actionType as string,
    actionData: JSON.parse(row.actionData as string),
    createdAt: row.createdAt as number,
  }));
  
  return activities;
};
