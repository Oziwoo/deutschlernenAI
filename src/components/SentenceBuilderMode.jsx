import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RATING, shuffle, buildStudyQueue } from '../lib/srs'
import { speakGerman } from '../lib/tts'
import { fetchSentence, checkSentence } from '../lib/gemini'

export default function SentenceBuilderMode({ words, progressMap, updateProgress }) {
  const navigate = useNavigate()
  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  
  const [mode, setMode] = useState('blocks') // 'blocks' or 'free'
  
  const [sentenceData, setSentenceData] = useState(null)
  const [loadingSentence, setLoadingSentence] = useState(false)
  
  // Blocks state
  const [availableBlocks, setAvailableBlocks] = useState([])
  const [selectedBlocks, setSelectedBlocks] = useState([])
  const [blockError, setBlockError] = useState(false)
  
  // Free mode state
  const [freeInput, setFreeInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loadingCheck, setLoadingCheck] = useState(false)
  
  const [done, setDone] = useState(false)
  const [apiError, setApiError] = useState(false)

  // Initialize queue
  useEffect(() => {
    // Only take words that the user is learning or needs to review (or some new)
    const q = buildStudyQueue(words, progressMap, 10).slice(0, 10)
    if (q.length === 0) {
      setDone(true)
    } else {
      setQueue(q)
    }
  }, [words])

  const currentWord = queue[index]

  // Fetch sentence
  useEffect(() => {
    if (!currentWord) return
    let cancelled = false

    const loadSentence = async () => {
      setLoadingSentence(true)
      setSentenceData(null)
      setAvailableBlocks([])
      setSelectedBlocks([])
      setBlockError(false)
      setFreeInput('')
      setFeedback(null)
      setApiError(false)

      try {
        const data = await fetchSentence(currentWord.word)
        if (cancelled) return
        
        setSentenceData(data)
        
        // Prepare blocks
        const tokens = data.german.split(' ').map(t => t.trim()).filter(Boolean)
        const shuffled = shuffle([...tokens].map((t, i) => ({ id: i, text: t })))
        setAvailableBlocks(shuffled)
        
      } catch (err) {
        console.error('Sentence load error:', err)
        if (!cancelled) setApiError(true)
      } finally {
        if (!cancelled) setLoadingSentence(false)
      }
    }

    loadSentence()
    return () => { cancelled = true }
  }, [currentWord])

  const nextQuestion = async (isCorrect) => {
    if (currentWord) {
      await updateProgress(currentWord.id, isCorrect ? RATING.GOOD : RATING.AGAIN)
    }
    const nextIdx = index + 1
    if (nextIdx >= queue.length) {
      setDone(true)
    } else {
      setIndex(nextIdx)
    }
  }

  // Handle block click
  const handleBlockClick = (block, from) => {
    if (feedback) return // already finished this question
    setBlockError(false)
    if (from === 'available') {
      setAvailableBlocks(prev => prev.filter(b => b.id !== block.id))
      setSelectedBlocks(prev => [...prev, block])
    } else {
      setSelectedBlocks(prev => prev.filter(b => b.id !== block.id))
      setAvailableBlocks(prev => [...prev, block])
    }
  }

  const checkBlocks = () => {
    if (!sentenceData) return
    const currentSentence = selectedBlocks.map(b => b.text).join(' ')
    if (currentSentence === sentenceData.german) {
      // Success!
      speakGerman(sentenceData.german)
      setFeedback({ status: 'correct', message: 'Отлично! Правильный порядок слов.' })
    } else {
      // Error
      setBlockError(true)
      // Allow infinite attempts, we just show error animation
      setTimeout(() => setBlockError(false), 500)
      // We can also mark it as wrong in progress immediately if it's the first mistake
      // But user wanted infinite attempts. Let's just let them retry.
    }
  }

  // Handle free form check
  const checkFreeForm = async () => {
    if (!freeInput.trim() || loadingCheck) return
    setLoadingCheck(true)
    try {
      const data = await checkSentence(currentWord.word, freeInput.trim())
      setFeedback({ status: data.status, message: data.feedback })
      if (data.status === 'correct' || data.status === 'minor_errors') {
        speakGerman(freeInput.trim())
      }
    } catch (err) {
      console.error('checkSentence error:', err)
      setFeedback({ status: 'incorrect', message: 'Не удалось проверить предложение. Попробуйте ещё раз.' })
    } finally {
      setLoadingCheck(false)
    }
  }

  if (done) {
    return (
      <div className="py-12 flex flex-col items-center gap-6 animate-fade-in text-center">
        <div className="text-5xl">🏆</div>
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white transition-colors">Тренировка завершена!</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1">Отличная работа над построением предложений.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">На главную</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 max-w-xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/')} className="text-stone-400 hover:text-stone-600 text-sm">← Назад</button>
        <span className="text-sm text-stone-400 font-mono">{index + 1} / {queue.length}</span>
        
        {/* Mode Toggle */}
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
          <button 
            onClick={() => { setMode('blocks'); setFeedback(null) }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'blocks' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
          >
            Блоки
          </button>
          <button 
            onClick={() => { setMode('free'); setFeedback(null) }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'free' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
          >
            Свой вариант
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full progress-fill" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

      {loadingSentence || !currentWord ? (
        <div className="py-12 flex flex-col items-center text-stone-400">
          <svg className="animate-spin w-8 h-8 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Генерируем задание...
        </div>
      ) : apiError ? (
        <div className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">⚠️</div>
          <div>
            <div className="font-semibold text-stone-900 dark:text-white">Не удалось загрузить задание</div>
            <div className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Проверьте подключение к интернету и правильность API-ключа.
            </div>
          </div>
          <button 
            onClick={() => { setApiError(false); setLoadingSentence(true) }}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
          >
            Попробовать снова
          </button>
          <button onClick={() => nextQuestion(false)} className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            Пропустить слово →
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 mb-4 transition-colors">
          
          <div className="mb-6">
            <div className="text-sm text-stone-500 dark:text-stone-400 mb-1">
              {mode === 'blocks' ? 'Собери перевод предложения:' : 'Составь предложение со словом:'}
            </div>
            {mode === 'blocks' ? (
              <div className="text-xl font-medium text-stone-900 dark:text-white leading-tight">
                {sentenceData?.russian}
              </div>
            ) : (
              <div className="text-2xl font-bold text-stone-900 dark:text-white">
                {currentWord.word}
              </div>
            )}
          </div>

          {/* Blocks Mode */}
          {mode === 'blocks' && (
            <div className="space-y-6">
              {/* Target Area */}
              <div className={`min-h-[60px] p-3 rounded-xl border-2 border-dashed ${blockError ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/10 animate-shake' : 'border-stone-200 dark:border-stone-700'} flex flex-wrap gap-2 items-start transition-all`}>
                {selectedBlocks.map(b => (
                  <button 
                    key={b.id} 
                    onClick={() => handleBlockClick(b, 'selected')}
                    className="px-3 py-2 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white rounded-lg shadow-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  >
                    {b.text}
                  </button>
                ))}
                {selectedBlocks.length === 0 && <span className="text-stone-400 dark:text-stone-600 p-2">Перетащите слова сюда...</span>}
              </div>

              {/* Source Area */}
              <div className="min-h-[60px] flex flex-wrap gap-2 justify-center">
                {availableBlocks.map(b => (
                  <button 
                    key={b.id} 
                    onClick={() => handleBlockClick(b, 'available')}
                    className="px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white rounded-lg shadow-sm font-medium hover:border-brand-300 hover:text-brand-600 transition-colors"
                  >
                    {b.text}
                  </button>
                ))}
              </div>

              {!feedback && availableBlocks.length === 0 && selectedBlocks.length > 0 && (
                <button 
                  onClick={checkBlocks}
                  className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors"
                >
                  Проверить
                </button>
              )}
            </div>
          )}

          {/* Free Mode */}
          {mode === 'free' && (
            <div className="space-y-4">
              <textarea 
                value={freeInput}
                onChange={e => setFreeInput(e.target.value)}
                placeholder={`Например: Ich lerne ${currentWord.word}...`}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:border-brand-500 min-h-[100px] resize-none transition-colors"
                disabled={feedback || loadingCheck}
              />
              
              {!feedback && (
                <button 
                  onClick={checkFreeForm}
                  disabled={!freeInput.trim() || loadingCheck}
                  className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                >
                  {loadingCheck ? 'Проверяем...' : 'Проверить AI'}
                </button>
              )}
            </div>
          )}

          {/* Feedback Area */}
          {feedback && (
            <div className={`mt-6 p-4 rounded-xl border ${
              feedback.status === 'correct' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
              feedback.status === 'minor_errors' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
              'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'
            }`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-0.5">
                  {feedback.status === 'correct' ? '✅' : feedback.status === 'minor_errors' ? '⚠️' : '❌'}
                </div>
                <div>
                  <div className={`font-semibold ${
                    feedback.status === 'correct' ? 'text-green-800 dark:text-green-400' :
                    feedback.status === 'minor_errors' ? 'text-amber-800 dark:text-amber-400' :
                    'text-rose-800 dark:text-rose-400'
                  }`}>
                    {feedback.status === 'correct' ? 'Отлично!' : feedback.status === 'minor_errors' ? 'Почти идеально' : 'Есть ошибки'}
                  </div>
                  <div className="text-stone-700 dark:text-stone-300 text-sm mt-1 leading-relaxed">
                    {feedback.message}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => nextQuestion(feedback.status === 'correct' || feedback.status === 'minor_errors')}
                className="mt-4 w-full py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                Следующее слово →
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
