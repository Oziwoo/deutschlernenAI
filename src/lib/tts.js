export function speakGerman(text) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported')
    return
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.9 // slightly slower for better comprehension

  // Try to find a good German voice (often Google's or system default)
  const voices = window.speechSynthesis.getVoices()
  const deVoice = voices.find(v => v.lang.startsWith('de') && (v.name.includes('Google') || v.name.includes('Premium'))) || voices.find(v => v.lang.startsWith('de'))
  
  if (deVoice) {
    utterance.voice = deVoice
  }

  window.speechSynthesis.speak(utterance)
}
