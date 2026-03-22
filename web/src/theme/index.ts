import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#2563eb',
    600: '#1d4ed8',
    700: '#1e40af',
    800: '#1e3a8a',
    900: '#1e3a5f',
  },
  stale: {
    50: '#fff7ed',
    100: '#ffedd5',
    500: '#f97316',
    600: '#ea580c',
  },
  dueSoon: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
  },
};

const components = {
  Button: {
    defaultProps: { colorScheme: 'brand' },
  },
  Tabs: {
    defaultProps: { colorScheme: 'brand' },
  },
};

export const theme = extendTheme({
  config,
  colors,
  components,
  fonts: {
    heading: "'Inter', -apple-system, sans-serif",
    body: "'Inter', -apple-system, sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
});

export const STATUS_COLORS: Record<string, string> = {
  not_started: 'gray',
  in_progress: 'blue',
  offered: 'green',
  rejected: 'red',
  underqualified: 'orange',
  missed_deadline: 'red',
  applied: 'cyan',
  archive: 'gray',
  other: 'purple',
};

export const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  offered: 'Offered',
  rejected: 'Rejected',
  underqualified: 'Underqualified',
  missed_deadline: 'Missed Deadline',
  applied: 'Applied',
  archive: 'Archive',
  other: 'Other',
};
