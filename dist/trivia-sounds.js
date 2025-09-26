// Simple sound effects for trivia game
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

export const playSound = (type) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  switch(type) {
    case 'correct':
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      break;
      
    case 'wrong':
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
      oscillator.frequency.setValueAtTime(207.65, audioContext.currentTime + 0.15); // Ab3
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      break;
      
    case 'click':
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      break;
      
    case 'success':
      oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.1); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3); // G5
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      break;
  }
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.6);
};