import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50:  '#EAF3DE',
    100: '#C0DD97',
    200: '#97C459',
    300: '#7AB83A',
    400: '#639922',
    500: '#3B6D11',
    600: '#2E570D',
    700: '#27500A',
    800: '#1A3C2E',
    900: '#122B20',
  },
  accent: {
    50:  '#eef0fb',
    100: '#d0d5f4',
    200: '#b2baed',
    300: '#8f9ae3',
    400: '#6B7FD4',
    500: '#5468c9',
    600: '#4055b8',
    700: '#3044a0',
    800: '#223282',
    900: '#162060',
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
        bg: '#F5F5F3',
        color: 'gray.800',
      },
    },
  },
});

export const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  not_started:      { bg: '#F1EFE8', color: '#444441', dot: '#888780' },
  in_progress:      { bg: '#E6F1FB', color: '#0C447C', dot: '#378ADD' },
  applied:          { bg: '#EAF3DE', color: '#27500A', dot: '#639922' },
  offered:          { bg: '#E1F5EE', color: '#085041', dot: '#1D9E75' },
  rejected:         { bg: '#FCEBEB', color: '#791F1F', dot: '#E24B4A' },
  underqualified:   { bg: '#FAEEDA', color: '#633806', dot: '#BA7517' },
  missed_deadline:  { bg: '#FCEBEB', color: '#791F1F', dot: '#E24B4A' },
  other:            { bg: '#EEEDFE', color: '#3C3489', dot: '#7F77DD' },
  archive:          { bg: '#F1EFE8', color: '#5F5E5A', dot: '#B4B2A9' },
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
