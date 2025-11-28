import { createTRPCReact } from "@trpc/react-query";
import { httpLink, loggerLink } from "@trpc/client";
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
  const baseUrl = getBaseUrl();
  console.log('[tRPC] Creating client with base URL:', baseUrl);
  
  return trpc.createClient({
    links: [
      loggerLink({
        enabled: () => true,
      }),
      httpLink({
        url: `${baseUrl}/api/trpc`,
        transformer: superjson,
        async headers() {
          try {
            const authData = await AsyncStorage.getItem('auth-storage');
            if (authData) {
              const parsed = JSON.parse(authData);
              const user = parsed?.state?.user;
              
              if (user) {
                console.log('[tRPC] Found user in storage:', { email: user.email, adminRole: user.adminRole });
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
            console.error('[tRPC] Failed to get auth data for trpc headers:', error);
          }
          
          return {};
        },
        fetch(url, options) {
          console.log('[tRPC] Making request to:', url);
          return fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              'Content-Type': 'application/json',
            },
          }).then(async (response) => {
            console.log('[tRPC] Response status:', response.status);
            console.log('[tRPC] Response content-type:', response.headers.get('content-type'));
            
            if (!response.ok) {
              const clonedResponse = response.clone();
              const text = await clonedResponse.text();
              console.error('[tRPC] Error response body:', text.substring(0, 500));
            }
            
            return response;
          });
        },
      }),
    ],
  });
};

export const trpcClient = createTRPCClient();
