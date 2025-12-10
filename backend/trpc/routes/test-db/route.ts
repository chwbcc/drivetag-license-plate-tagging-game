import { publicProcedure } from "../../create-context";
import { getDatabase } from "../../../database";
import { z } from "zod";

export const testConnectionProcedure = publicProcedure.query(async () => {
  try {
    const db = getDatabase();
    
    console.log('[TestDB] Testing database connection...');
    
    const { data, error } = await db
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('[TestDB] Connection test failed:', error);
      return {
        success: false,
        message: 'Database connection failed',
        error: error.message,
      };
    }
    
    console.log('[TestDB] Connection successful!');
    
    return {
      success: true,
      message: 'Database connected successfully!',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[TestDB] Error testing connection:', error);
    return {
      success: false,
      message: 'Failed to connect to database',
      error: error?.message || 'Unknown error',
    };
  }
});

export const testInsertUserProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      username: z.string(),
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const db = getDatabase();
      
      console.log('[TestDB] Testing user insertion...');
      
      const testUser = {
        id: `test-${Date.now()}`,
        email: input.email,
        username: input.username,
        passwordHash: input.password,
        createdAt: Date.now(),
        stats: JSON.stringify({
          pelletCount: 10,
          positivePelletCount: 5,
          badges: [],
          exp: 0,
          level: 1,
          name: input.username,
          photo: null,
          licensePlate: 'TEST123',
          state: 'CA',
        }),
        role: 'user',
        licensePlate: 'TEST123',
        state: 'CA',
      };
      
      const { data, error } = await db
        .from('users')
        .insert(testUser)
        .select()
        .single();
      
      if (error) {
        console.error('[TestDB] User insertion failed:', error);
        return {
          success: false,
          message: 'Failed to insert user',
          error: error.message,
        };
      }
      
      console.log('[TestDB] User inserted successfully:', data);
      
      return {
        success: true,
        message: 'User inserted successfully!',
        userId: testUser.id,
        data,
      };
    } catch (error: any) {
      console.error('[TestDB] Error inserting user:', error);
      return {
        success: false,
        message: 'Failed to insert user',
        error: error?.message || 'Unknown error',
      };
    }
  });

export const testInsertPelletProcedure = publicProcedure
  .input(
    z.object({
      targetLicensePlate: z.string(),
      createdBy: z.string(),
      reason: z.string(),
      type: z.enum(['negative', 'positive']),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const db = getDatabase();
      
      console.log('[TestDB] Testing pellet insertion...');
      
      const testPellet = {
        id: `test-pellet-${Date.now()}`,
        targetLicensePlate: input.targetLicensePlate,
        targetUserId: null,
        createdBy: input.createdBy,
        createdAt: Date.now(),
        reason: input.reason,
        type: input.type,
        latitude: 37.7749,
        longitude: -122.4194,
      };
      
      const { data, error } = await db
        .from('pellets')
        .insert(testPellet)
        .select()
        .single();
      
      if (error) {
        console.error('[TestDB] Pellet insertion failed:', error);
        return {
          success: false,
          message: 'Failed to insert pellet',
          error: error.message,
        };
      }
      
      console.log('[TestDB] Pellet inserted successfully:', data);
      
      return {
        success: true,
        message: 'Pellet inserted successfully!',
        pelletId: testPellet.id,
        data,
      };
    } catch (error: any) {
      console.error('[TestDB] Error inserting pellet:', error);
      return {
        success: false,
        message: 'Failed to insert pellet',
        error: error?.message || 'Unknown error',
      };
    }
  });

export const testGetAllDataProcedure = publicProcedure.query(async () => {
  try {
    const db = getDatabase();
    
    console.log('[TestDB] Fetching all data from tables...');
    
    const [usersResult, pelletsResult, badgesResult, activitiesResult] = await Promise.all([
      db.from('users').select('*').limit(10),
      db.from('pellets').select('*').limit(10),
      db.from('badges').select('*').limit(10),
      db.from('activities').select('*').limit(10),
    ]);
    
    return {
      success: true,
      message: 'Data fetched successfully!',
      data: {
        users: {
          count: usersResult.data?.length || 0,
          data: usersResult.data || [],
          error: usersResult.error?.message,
        },
        pellets: {
          count: pelletsResult.data?.length || 0,
          data: pelletsResult.data || [],
          error: pelletsResult.error?.message,
        },
        badges: {
          count: badgesResult.data?.length || 0,
          data: badgesResult.data || [],
          error: badgesResult.error?.message,
        },
        activities: {
          count: activitiesResult.data?.length || 0,
          data: activitiesResult.data || [],
          error: activitiesResult.error?.message,
        },
      },
    };
  } catch (error: any) {
    console.error('[TestDB] Error fetching data:', error);
    return {
      success: false,
      message: 'Failed to fetch data',
      error: error?.message || 'Unknown error',
    };
  }
});

export default testConnectionProcedure;
