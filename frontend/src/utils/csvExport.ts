export const exportSessionsToCSV = (sessions: any[]) => {
  if (sessions.length === 0) {
    alert('No sessions to export');
    return;
  }

  const headers = [
    'Session ID',
    'User ID',
    'Game Name',
    'Duration (seconds)',
    'Start Time',
    'End Time',
    'Reading Speed (WPM)',
    'Fixation Count',
    'Accuracy (%)',
    'Regression Count',
    'Fixation Mean Duration (ms)',
    'Score Total'
  ];

  const rows = sessions.map(session => [
    session.sessionId,
    session.userId,
    session.gameName || 'N/A',
    session.sessionDuration || 0,
    session.timestamp,
    session.endTimestamp,
    session.readingSpeedWPM,
    session.fixationCount,
    session.accuracy,
    session.regressionCount,
    session.fixationMeanDuration,
    session.scoreTotal
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `all_sessions_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportUserSessionsToCSV = (userId: string) => {
  const sessions = JSON.parse(localStorage.getItem('dyslexiaSessions') || '[]');
  const userSessions = sessions.filter((s: any) => s.userId === userId);
  
  if (userSessions.length === 0) {
    alert(`No sessions found for user: ${userId}`);
    return;
  }

  exportSessionsToCSV(userSessions);
};

export const exportAllSessionsToCSV = () => {
  const sessions = JSON.parse(localStorage.getItem('dyslexiaSessions') || '[]');
  exportSessionsToCSV(sessions);
};
