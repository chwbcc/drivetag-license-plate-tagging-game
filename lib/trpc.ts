import { createTRPCReact, createTRPCClient as createVanillaTRPCClient } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
          try {
            console.log('[tRPC Client] Request:', url);
            const response = await fetch(url, options);
            console.log('[tRPC Client] Response status:', response.status);
            
            if (!response.ok) {
              const text = await response.clone().text();
              console.error('[tRPC Client] Non-OK response:', {
                status: response.status,
                statusText: response.statusText,
                body: text.substring(0, 200),
              });
            }
            
            return response;
          } catch (error) {
            console.error('[tRPC Client] Fetch error:', error);
            throw error;
          }
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
          console.log('[tRPC Client] Request:', url);
          const response = await fetch(url, options);
          console.log('[tRPC Client] Response status:', response.status);
          
          if (!response.ok) {
            const text = await response.clone().text();
            console.error('[tRPC Client] Non-OK response:', {
              status: response.status,
              statusText: response.statusText,
              body: text.substring(0, 200),
            });
          }
          
          return response;
        } catch (error) {
          console.error('[tRPC Client] Fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});
