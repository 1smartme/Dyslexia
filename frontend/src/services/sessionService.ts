interface SessionData {
  sessionId: string;
  userId: string;
  timestamp: string;
  endTimestamp: string;
  readingSpeedWPM: number;
  fixationCount: number;
  accuracy: number;
  regressionCount: number;
  fixationMeanDuration: number;
  scoreTotal: number;
}

export const sessionService = {
  async saveSession(sessionData: SessionData): Promise<void> {
    const sessions = this.getLocalSessions();
    sessions.push(sessionData);
    localStorage.setItem('dyslexiaSessions', JSON.stringify(sessions));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      
      if (!response.ok) throw new Error('Failed to save session');
    } catch (error) {
      console.error('Error saving session:', error);
    }
  },

  getLocalSessions(): SessionData[] {
    return JSON.parse(localStorage.getItem('dyslexiaSessions') || '[]');
  },

  getUserSessions(userId: string): SessionData[] {
    return this.getLocalSessions().filter(s => s.userId === userId);
  },

  async fetchUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/sessions/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return this.getUserSessions(userId);
    }
  },

  clearLocalSessions(): void {
    localStorage.removeItem('dyslexiaSessions');
  }
};
