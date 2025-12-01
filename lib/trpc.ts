import { createTRPCReact, createTRPCClient as createVanillaTRPCClient } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import AsyncStorage from '@react-native-async-storage/async-storage';

let retryCount = 0;
let lastRetryTime = 0;
const MAX_RETRIES = 5;
const BASE_DELAY = 2000;
const RATE_LIMIT_DELAY = 10000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

export const createTRPCClient = () => {
  return trpc.createClient({
    links: [
      httpLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        async headers() {
          try {
            const authData = await AsyncStorage.getItem('auth-storage');
            if (authData) {
              const parsed = JSON.parse(authData);
              const user = parsed?.state?.user;
              
              if (user) {
                return {
                  'x-user-data': JSON.stringify({
                    id: user.id,
                    email: user.email,
                    adminRole: user.adminRole || null,
                  }),
                };
              }
            }
          } catch (error) {
            console.error('Failed to get auth data for trpc headers:', error);
          }
          
          return {};
        },
        fetch: async (url, options) => {
          let attempt = 0;
          
          while (attempt <= MAX_RETRIES) {
            try {
              if (attempt > 0) {
                const delay = BASE_DELAY * Math.pow(2, attempt - 1);
                console.log(`[tRPC Client] Retry attempt ${attempt}/${MAX_RETRIES} after ${delay}ms`);
                await wait(delay);
              }
              
              console.log('[tRPC Client] Making request to:', url);
              console.log('[tRPC Client] Base URL:', getBaseUrl());
              console.log('[tRPC Client] Request method:', options?.method || 'GET');
              
              const response = await fetch(url, options);
              console.log('[tRPC Client] Response received - Status:', response.status);
              
              if (response.status === 429) {
                const now = Date.now();
                if (now - lastRetryTime < 5000) {
                  retryCount++;
                } else {
                  retryCount = 1;
                }
                lastRetryTime = now;
                
                console.warn(`[tRPC Client] Rate limited (429). Waiting ${RATE_LIMIT_DELAY}ms before retry...`);
                
                if (attempt < MAX_RETRIES) {
                  await wait(RATE_LIMIT_DELAY * (attempt + 1));
                  attempt++;
                  continue;
                }
                
                console.error('[tRPC Client] Max retries reached for rate limit. Please wait before making more requests.');
              }
              
              if (!response.ok) {
                const text = await response.clone().text();
                console.error('[tRPC Client] ========= ERROR RESPONSE =========');
                console.error('[tRPC Client] URL:', url);
                console.error('[tRPC Client] Status:', response.status);
                console.error('[tRPC Client] Status Text:', response.statusText);
                console.error('[tRPC Client] Response Body:', text.substring(0, 500));
                console.error('[tRPC Client] Full Base URL:', getBaseUrl());
                console.error('[tRPC Client] ===================================');
                
                try {
                  const json = JSON.parse(text);
                  console.error('[tRPC Client] Parsed Error:', JSON.stringify(json, null, 2));
                } catch (e) {
                  console.error('[tRPC Client] Could not parse response as JSON - this is likely an HTML error page');
                }
              } else {
                retryCount = 0;
              }
              
              return response;
            } catch (error) {
              if (attempt >= MAX_RETRIES) {
                console.error('[tRPC Client] ========= FETCH ERROR =========');
                console.error('[tRPC Client] URL attempted:', url);
                console.error('[tRPC Client] Error:', error);
                console.error('[tRPC Client] Error type:', typeof error);
                console.error('[tRPC Client] Error name:', (error as any)?.name);
                console.error('[tRPC Client] Error message:', (error as any)?.message);
                console.error('[tRPC Client] =====================================');
                throw error;
              }
              
              console.warn(`[tRPC Client] Fetch error on attempt ${attempt + 1}/${MAX_RETRIES + 1}:`, (error as any)?.message);
              attempt++;
            }
          }
          
          throw new Error('Max retries exceeded');
        },
      }),
    ],
  });
};

export const trpcClient = createVanillaTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        try {
          const authData = await AsyncStorage.getItem('auth-storage');
          if (authData) {
            const parsed = JSON.parse(authData);
            const user = parsed?.state?.user;
            
            if (user) {
              return {
                'x-user-data': JSON.stringify({
                  id: user.id,
                  email: user.email,
                  adminRole: user.adminRole || null,
                }),
              };
            }
          }
        } catch (error) {
          console.error('Failed to get auth data for trpc headers:', error);
        }
        
        return {};
      },
      fetch: async (url, options) => {
        try {
          console.log('[tRPC Vanilla Client] Making request to:', url);
          console.log('[tRPC Vanilla Client] Base URL:', getBaseUrl());
          
          const response = await fetch(url, options);
          console.log('[tRPC Vanilla Client] Response received - Status:', response.status);
          
          if (!response.ok) {
            const text = await response.clone().text();
            console.error('[tRPC Vanilla Client] ========= ERROR RESPONSE =========');
            console.error('[tRPC Vanilla Client] URL:', url);
            console.error('[tRPC Vanilla Client] Status:', response.status);
            console.error('[tRPC Vanilla Client] Status Text:', response.statusText);
            console.error('[tRPC Vanilla Client] Response Body:', text.substring(0, 500));
            console.error('[tRPC Vanilla Client] ===================================');
            
            try {
              const json = JSON.parse(text);
              console.error('[tRPC Vanilla Client] Parsed Error:', JSON.stringify(json, null, 2));
            } catch (e) {
              console.error('[tRPC Vanilla Client] Could not parse response as JSON');
            }
          }
          
          return response;
        } catch (error) {
          console.error('[tRPC Vanilla Client] Fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});
