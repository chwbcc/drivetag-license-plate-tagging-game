import { createTRPCReact, createTRPCClient as createVanillaTRPCClient } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const trpcClient = trpc.createClient({
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
                console.log(`[tRPC Client] Retry attempt ${attempt} after ${delay}ms`);
                await wait(delay);
              }
              
              const response = await fetch(url, options);
              
              if (!response.ok) {
                console.log(`[tRPC Client] Non-OK response: ${response.status} ${response.statusText}`);
                const contentType = response.headers.get('content-type') || '';
                
                if (response.status === 429) {
                  if (attempt < MAX_RETRIES) {
                    console.log(`[tRPC Client] Rate limited, waiting ${RATE_LIMIT_DELAY * (attempt + 1)}ms`);
                    await wait(RATE_LIMIT_DELAY * (attempt + 1));
                    attempt++;
                    continue;
                  }
                }
                
                if (!contentType.includes('application/json')) {
                  const responseText = await response.clone().text();
                  console.log(`[tRPC Client] Server returned non-JSON: ${responseText.substring(0, 200)}`);
                  throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
              }
              
              return response;
            } catch (error) {
              console.error(`[tRPC Client] Fetch error on attempt ${attempt}:`, error);
              if (attempt >= MAX_RETRIES) {
                throw error;
              }
              attempt++;
            }
          }
          
          throw new Error('Max retries exceeded');
        },
      }),
    ],
  });

export const vanillaClient = createVanillaTRPCClient<AppRouter>({
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
              console.log(`[tRPC Vanilla Client] Retry attempt ${attempt} after ${delay}ms`);
              await wait(delay);
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
              console.log('[tRPC Vanilla Client] ========= ERROR RESPONSE =========');
              console.log(`[tRPC Vanilla Client] URL: ${url}`);
              console.log(`[tRPC Vanilla Client] Status: ${response.status}`);
              console.log(`[tRPC Vanilla Client] Status Text: ${response.statusText}`);
              
              const contentType = response.headers.get('content-type') || '';
              console.log(`[tRPC Vanilla Client] Content-Type: ${contentType}`);
              
              const responseText = await response.clone().text();
              console.log(`[tRPC Vanilla Client] Response Body: ${responseText.substring(0, 500)}`);
              console.log('[tRPC Vanilla Client] ===================================');
              
              if (response.status === 429) {
                if (attempt < MAX_RETRIES) {
                  console.log(`[tRPC Vanilla Client] Rate limited, waiting ${RATE_LIMIT_DELAY * (attempt + 1)}ms`);
                  await wait(RATE_LIMIT_DELAY * (attempt + 1));
                  attempt++;
                  continue;
                }
              }
              
              if (!contentType.includes('application/json')) {
                console.log('[tRPC Vanilla Client] Server did not return JSON');
                throw new Error(`Server error: ${response.status} ${response.statusText}. ${responseText.substring(0, 200)}`);
              }
            }
            
            return response;
          } catch (error) {
            console.error(`[tRPC Vanilla Client] Fetch error on attempt ${attempt}:`, error);
            if (attempt >= MAX_RETRIES) {
              throw error;
            }
            attempt++;
          }
        }
        
        throw new Error('Max retries exceeded');
      },
    }),
  ],
});
