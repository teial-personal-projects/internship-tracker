export const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  // v1 statuses (current pipeline)
  not_started:     { bg: '#F3E9D7', color: '#8A93AE', dot: '#8A93AE' },
  in_progress:     { bg: '#F7D9CD', color: '#A8442A', dot: '#A8442A' },
  applied:         { bg: '#F3E9D7', color: '#4E5775', dot: '#4E5775' },
  offered:         { bg: '#DDE8DF', color: '#6B8F7A', dot: '#6B8F7A' },
  rejected:        { bg: '#F3D5DA', color: '#B5394A', dot: '#B5394A' },
  underqualified:  { bg: '#F5E6C4', color: '#A36410', dot: '#A36410' },
  missed_deadline: { bg: '#F3D5DA', color: '#B5394A', dot: '#B5394A' },
  interviewing:    { bg: '#E0DAF0', color: '#7C6CB0', dot: '#7C6CB0' },
  other:           { bg: '#F3E9D7', color: '#8A93AE', dot: '#8A93AE' },
  archive:         { bg: '#F3E9D7', color: '#B8BECF', dot: '#B8BECF' },

  // v2 statuses
  phone_screen:    { bg: '#F7D9CD', color: '#A8442A', dot: '#A8442A' },
  technical:       { bg: '#E0DAF0', color: '#7C6CB0', dot: '#7C6CB0' },
  final_round:     { bg: '#DDE8DF', color: '#6B8F7A', dot: '#6B8F7A' },
};

export const STATUS_LABELS: Record<string, string> = {
  not_started:     'Not Started',
  in_progress:     'In Progress',
  offered:         'Offered',
  rejected:        'Rejected',
  underqualified:  'Underqualified',
  missed_deadline: 'Missed Deadline',
  applied:         'Applied',
  interviewing:    'Interviewing',
  archive:         'Archive',
  other:           'Other',
  phone_screen:    'Phone Screen',
  technical:       'Technical',
  final_round:     'Final Round',
};

export const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  high: { bg: '#F7D9CD', color: '#C85A3A' },
  med:  { bg: '#F5E6C4', color: '#A36410' },
  low:  { bg: '#F3E9D7', color: '#8A93AE' },
};
