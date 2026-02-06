import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useSegments, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import Colors from "@/constants/colors";
import { ThemeProvider, useTheme } from "@/store/theme-store";
import { LicensePlateGameProvider } from "@/store/license-plate-game-store";
import { CarSpotterGameProvider } from "@/store/car-spotter-game-store";
import { darkMode } from "@/constants/styles";
import useAuthStore from "@/store/auth-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        throwOnError: false,
        useErrorBoundary: false,
        suspense: false,
        networkMode: 'offlineFirst',
      },
      mutations: {
        throwOnError: false,
        useErrorBoundary: false,
        networkMode: 'offlineFirst',
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: (error) => {
        console.warn('[QueryClient] Suppressed error:', error);
      },
    },
  }));
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LicensePlateGameProvider>
          <CarSpotterGameProvider>
            <RootLayoutNav />
          </CarSpotterGameProvider>
        </LicensePlateGameProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const { isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [isNavigationReady, setIsNavigationReady] = React.useState(false);

  React.useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    if (!isNavigationReady || !hasHydrated) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === undefined;

    if (!user && !inAuthGroup) {
      setTimeout(() => router.replace('/(auth)' as any), 0);
    } else if (user && inAuthGroup) {
      setTimeout(() => router.replace('/(tabs)/home' as any), 0);
    }
  }, [user, segments, isNavigationReady, hasHydrated, router]);
  
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? darkMode.background : Colors.background,
          },
          headerTintColor: isDark ? darkMode.text : Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: isDark ? darkMode.background : Colors.background,
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="tag-driver" 
          options={{ 
            title: "Tag a Driver",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="edit-profile" 
          options={{ 
            title: "Edit Profile",
            headerBackTitle: "Back",
          }} 
        />
        <Stack.Screen 
          name="license-plate-game" 
          options={{ 
            title: "License Plate Spotter",
            headerBackTitle: "Games",
          }} 
        />
        <Stack.Screen 
          name="car-spotter-game" 
          options={{ 
            title: "Car Spotter",
            headerBackTitle: "Games",
          }} 
        />
      </Stack>
    </>
  );
}