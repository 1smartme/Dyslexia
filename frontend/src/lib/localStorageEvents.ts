// Custom event for localStorage changes
export function dispatchGameResultUpdate() {
  window.dispatchEvent(new CustomEvent('gameResultUpdated'))
}

export function subscribeToGameResults(callback: () => void) {
  const handleUpdate = () => callback()
  
  window.addEventListener('gameResultUpdated', handleUpdate)
  
  return () => {
    window.removeEventListener('gameResultUpdated', handleUpdate)
  }
}