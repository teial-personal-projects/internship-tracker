export const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  not_started:     { bg: '#F1EFE8', color: '#444441', dot: '#888780' },
  in_progress:     { bg: '#E6F1FB', color: '#0C447C', dot: '#378ADD' },
  applied:         { bg: '#EAF3DE', color: '#27500A', dot: '#639922' },
  offered:         { bg: '#E1F5EE', color: '#085041', dot: '#1D9E75' },
  rejected:        { bg: '#FCEBEB', color: '#791F1F', dot: '#E24B4A' },
  underqualified:  { bg: '#FAEEDA', color: '#633806', dot: '#BA7517' },
  missed_deadline: { bg: '#FCEBEB', color: '#791F1F', dot: '#E24B4A' },
  interviewing:    { bg: '#EEEDFE', color: '#3C3489', dot: '#7F77DD' },
  other:           { bg: '#F2EBE3', color: '#5C3D1E', dot: '#9C6B3C' },
  archive:         { bg: '#F1EFE8', color: '#5F5E5A', dot: '#B4B2A9' },
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
};
