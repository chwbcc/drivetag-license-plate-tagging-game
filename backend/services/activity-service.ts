import { getDatabase, type DBActivity } from '../database';

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
  const dataJson = actionData ? JSON.stringify(actionData) : null;
  
  await db.execute({
    sql: `
      INSERT INTO user_activity (id, user_id, action_type, action_data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [
      id,
      userId,
      actionType,
      dataJson,
      Math.floor(Date.now() / 1000)
    ]
  });
};

export const getUserActivity = async (userId: string, limit = 50): Promise<UserActivity[]> => {
  const db = getDatabase();
  
  const result = await db.execute({
    sql: 'SELECT * FROM user_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    args: [userId, limit]
  });
  
  return result.rows.map(row => {
    const r = row as unknown as DBActivity;
    return {
      id: r.id,
      userId: r.user_id,
      actionType: r.action_type,
      actionData: r.action_data ? JSON.parse(r.action_data) : null,
      createdAt: r.created_at,
    };
  });
};

export const getAllUserActivity = async (limit = 100): Promise<UserActivity[]> => {
  const db = getDatabase();
  
  const result = await db.execute({
    sql: 'SELECT * FROM user_activity ORDER BY created_at DESC LIMIT ?',
    args: [limit]
  });
  
  return result.rows.map(row => {
    const r = row as unknown as DBActivity;
    return {
      id: r.id,
      userId: r.user_id,
      actionType: r.action_type,
      actionData: r.action_data ? JSON.parse(r.action_data) : null,
      createdAt: r.created_at,
    };
  });
};
