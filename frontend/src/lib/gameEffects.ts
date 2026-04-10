// Sound effects and visual feedback utilities
export const playSuccessSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  
  // Play a cheerful melody
  const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1)
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3)
    
    oscillator.start(audioContext.currentTime + i * 0.1)
    oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3)
  })
}

export const playErrorSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  
  // Play a gentle "try again" sound
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
  oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.2)
  oscillator.type = 'triangle'
  
  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.4)
}

export const playClickSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
  oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.05)
  oscillator.type = 'sine'
  
  gainNode.gain.setValueAtTime(0.08, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.1)
}

export const createParticles = (element: HTMLElement, color: string = '#10B981') => {
  const emojis = ['⭐', '🎉', '✨', '💫', '🌟', '🎊']
  
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div')
    const isEmoji = Math.random() > 0.5
    
    if (isEmoji) {
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)]
      particle.style.cssText = `
        position: absolute;
        font-size: 20px;
        pointer-events: none;
        z-index: 1000;
      `
    } else {
      particle.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        box-shadow: 0 0 10px ${color};
      `
    }
    
    const rect = element.getBoundingClientRect()
    particle.style.left = rect.left + rect.width / 2 + 'px'
    particle.style.top = rect.top + rect.height / 2 + 'px'
    
    document.body.appendChild(particle)
    
    const angle = (i / 15) * Math.PI * 2
    const velocity = 120 + Math.random() * 80
    const vx = Math.cos(angle) * velocity
    const vy = Math.sin(angle) * velocity - 50
    
    particle.animate([
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${vx}px, ${vy}px) scale(0) rotate(360deg)`, opacity: 0 }
    ], {
      duration: 1200,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => particle.remove()
  }
}

export const shakeElement = (element: HTMLElement) => {
  element.animate([
    { transform: 'translateX(0) rotate(0deg)' },
    { transform: 'translateX(-8px) rotate(-2deg)' },
    { transform: 'translateX(8px) rotate(2deg)' },
    { transform: 'translateX(-6px) rotate(-1deg)' },
    { transform: 'translateX(6px) rotate(1deg)' },
    { transform: 'translateX(0) rotate(0deg)' }
  ], {
    duration: 400,
    easing: 'ease-in-out'
  })
}

export const createStickers = (element: HTMLElement, type: 'success' | 'error' = 'success') => {
  const successStickers = ['🎉', '⭐', '🌟', '✨', '🎊', '💫', '🏆', '👏', '🎯', '💯']
  const errorStickers = ['😅', '🤔', '💭', '🔄', '💪', '🎯']
  
  const stickers = type === 'success' ? successStickers : errorStickers
  const count = type === 'success' ? 8 : 4
  
  for (let i = 0; i < count; i++) {
    const sticker = document.createElement('div')
    sticker.textContent = stickers[Math.floor(Math.random() * stickers.length)]
    sticker.style.cssText = `
      position: absolute;
      font-size: 24px;
      pointer-events: none;
      z-index: 1000;
    `
    
    const rect = element.getBoundingClientRect()
    sticker.style.left = rect.left + Math.random() * rect.width + 'px'
    sticker.style.top = rect.top + Math.random() * rect.height + 'px'
    
    document.body.appendChild(sticker)
    
    sticker.animate([
      { transform: 'scale(0) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1.2) rotate(180deg)', opacity: 1, offset: 0.5 },
      { transform: 'scale(0.8) rotate(360deg)', opacity: 0 }
    ], {
      duration: 2000,
      easing: 'ease-out'
    }).onfinish = () => sticker.remove()
  }
}

export const playLevelUpSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51] // C5 to E6
  
  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.08)
    oscillator.type = 'triangle'
    
    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + i * 0.08)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.08 + 0.4)
    
    oscillator.start(audioContext.currentTime + i * 0.08)
    oscillator.stop(audioContext.currentTime + i * 0.08 + 0.4)
  })
}