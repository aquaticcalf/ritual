import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { getThemePreference } from '@/lib/themeManager';

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [themePreference, setThemePreference] = useState<string | null>(null);
  const deviceColorScheme = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
    
    const loadTheme = async () => {
      const savedTheme = await getThemePreference();
      setThemePreference(savedTheme);
    };
    
    loadTheme();
    
    // Listen for theme preference changes
    const intervalId = setInterval(loadTheme, 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (!hasHydrated) {
    return 'light';
  }
  
  if (themePreference === 'light') return 'light';
  if (themePreference === 'dark') return 'dark';
  
  return deviceColorScheme || 'light';
}
