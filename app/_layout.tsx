import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useSegments, useRouter, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import Colors from "@/constants/colors";
import { ThemeProvider, useTheme } from "@/store/theme-store";
import { darkMode } from "@/constants/styles";
import useAuthStore from "@/store/auth-store";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!navigationState?.key) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, navigationState?.key]);
  
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
          }} 
        />
        <Stack.Screen 
          name="admin" 
          options={{ 
            title: "Admin Dashboard",
          }} 
        />
      </Stack>
    </>
  );
}