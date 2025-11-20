import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Category, Word, QuizQuestion } from '@/types'

interface StoreState {
    user: any | null
    categories: Category[]
    words: Word[]
    loading: boolean
    quizMode: 'linear' | 'random'
    currentCategoryFilter: string | null // null = all
    quizQuestions: QuizQuestion[]
    currentQuestionIndex: number
    score: number
    flashcardActive: boolean
    apiKey: string | null

    setApiKey: (key: string) => void

    setUser: (user: any | null) => void
    fetchData: () => Promise<void>
    addCategory: (name: string) => Promise<Category | null>
    updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_system'>>) => Promise<void>
    addWord: (word: Omit<Word, 'id' | 'user_id' | 'created_at'>) => Promise<void>
    updateWord: (id: string, updates: Partial<Omit<Word, 'id' | 'user_id' | 'created_at'>>) => Promise<void>
    deleteWord: (id: string) => Promise<void>
    deleteCategory: (id: string) => Promise<void>
    setQuizMode: (mode: 'linear' | 'random') => void
    setCategoryFilter: (categoryId: string | null) => void
    startQuiz: (config: { mode: 'new' | 'review' | 'random', count: number, direction: 'german_to_translation' | 'translation_to_german' | 'mixed' }) => void
    submitAnswer: (answer: string) => Promise<boolean>
    nextQuestion: () => void
    resetQuiz: () => void
    startFlashcards: () => void
    exitFlashcards: () => void

    // SRS Helpers
    getDueWords: () => Word[]

    // Image Upload
    uploadImage: (file: File) => Promise<string | null>
}

export const useStore = create<StoreState>((set, get) => ({
    user: null,
    categories: [],
    words: [],
    loading: false,
    quizMode: 'linear',
    currentCategoryFilter: null,
    quizQuestions: [],
    currentQuestionIndex: 0,
    score: 0,
    flashcardActive: false,
    apiKey: localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || null,

    setApiKey: (key) => {
        localStorage.setItem('gemini_api_key', key)
        set({ apiKey: key })
    },

    setUser: (user) => set({ user }),

    fetchData: async () => {
        set({ loading: true })
        const { user } = get()

        // Ensure Uncategorized category exists
        const { data: existingUncategorized } = await supabase
            .from('categories')
            .select('*')
            .eq('is_system', true)
            .eq('name', 'Uncategorized')
            .single()

        if (!existingUncategorized && user) {
            await supabase.from('categories').insert([{
                name: 'Uncategorized',
                original_language: 'de',
                translation_language: 'en',
                is_system: true
            }])
        }

        const { data: categories } = await supabase.from('categories').select('*').order('name')
        const { data: words } = await supabase.from('words').select('*').order('created_at', { ascending: false })
        set({ categories: categories || [], words: words || [], loading: false })
    },

    addCategory: async (name) => {
        const { data, error } = await supabase.from('categories').insert([{
            name,
            original_language: 'de',
            translation_language: 'en'
        }]).select().single()
        if (error) {
            console.error('Error adding category:', error)
            return null
        }
        set((state) => ({ categories: [...state.categories, data] }))
        return data
    },

    updateCategory: async (id, updates) => {
        const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single()
        if (error) {
            console.error('Error updating category:', error)
            return
        }
        set((state) => ({
            categories: state.categories.map((c) => (c.id === id ? data : c))
        }))
    },

    addWord: async (word) => {
        const { data, error } = await supabase.from('words').insert([word]).select().single()
        if (error) {
            console.error('Error adding word:', error)
            return
        }
        set((state) => ({ words: [data, ...state.words] }))
    },

    deleteWord: async (id) => {
        const { error } = await supabase.from('words').delete().eq('id', id)
        if (error) {
            console.error('Error deleting word:', error)
            return
        }
        set((state) => ({ words: state.words.filter((w) => w.id !== id) }))
    },

    updateWord: async (id, updates) => {
        const { data, error } = await supabase.from('words').update(updates).eq('id', id).select().single()
        if (error) {
            console.error('Error updating word:', error)
            return
        }
        set((state) => ({
            words: state.words.map((w) => (w.id === id ? data : w))
        }))
    },

    deleteCategory: async (id) => {
        const category = get().categories.find((c) => c.id === id)
        if (category?.is_system) {
            console.error('Cannot delete system category')
            return
        }
        const { error } = await supabase.from('categories').delete().eq('id', id)
        if (error) {
            console.error('Error deleting category:', error)
            return
        }
        set((state) => ({
            categories: state.categories.filter((c) => c.id !== id),
            currentCategoryFilter: state.currentCategoryFilter === id ? null : state.currentCategoryFilter
        }))
    },

    setQuizMode: (mode) => set({ quizMode: mode }),
    setCategoryFilter: (categoryId) => set({ currentCategoryFilter: categoryId }),

    startQuiz: (config) => {
        const { words, currentCategoryFilter } = get()
        let filteredWords = currentCategoryFilter
            ? words.filter((w) => w.category_id === currentCategoryFilter)
            : words

        // Filter based on mode
        if (config.mode === 'review') {
            const now = new Date()
            filteredWords = filteredWords.filter(w => {
                if (!w.next_review) return true // New words are due
                return new Date(w.next_review) <= now
            })
            // Sort by due date (overdue first)
            filteredWords.sort((a, b) => {
                const dateA = a.next_review ? new Date(a.next_review).getTime() : 0
                const dateB = b.next_review ? new Date(b.next_review).getTime() : 0
                return dateA - dateB
            })
        } else if (config.mode === 'new') {
            // Linear mode - maybe just sort by created_at?
            // For now, just use all words but keep order
        } else if (config.mode === 'random') {
            filteredWords = [...filteredWords].sort(() => 0.5 - Math.random())
        }

        // Limit count
        if (config.count < 9999) {
            filteredWords = filteredWords.slice(0, config.count)
        }

        if (filteredWords.length < 4) {
            alert('Not enough words to start a quiz (need at least 4)')
            return
        }

        const questions: QuizQuestion[] = filteredWords.map((word) => {
            let type: 'german_to_translation' | 'translation_to_german' = 'german_to_translation'

            if (config.direction === 'mixed') {
                type = Math.random() > 0.5 ? 'german_to_translation' : 'translation_to_german'
            } else {
                type = config.direction
            }

            const correctOption = type === 'german_to_translation' ? word.translation : word.german_word

            // Get distractors
            const otherWords = words.filter((w) => w.id !== word.id)
            const distractors = otherWords
                .sort(() => 0.5 - Math.random())
                .slice(0, 3)
                .map((w) => (type === 'german_to_translation' ? w.translation : w.german_word))

            const options = [...distractors, correctOption].sort(() => 0.5 - Math.random())

            return {
                word,
                options,
                correctOption,
                type,
            }
        })

        set({ quizQuestions: questions, currentQuestionIndex: 0, score: 0 })
    },

    submitAnswer: async (answer) => {
        const { quizQuestions, currentQuestionIndex, score, user } = get()
        const currentQuestion = quizQuestions[currentQuestionIndex]
        const isCorrect = answer === currentQuestion.correctOption
        const word = currentQuestion.word

        if (isCorrect) {
            set({ score: score + 1 })
        }

        // SRS Logic (SM-2)
        // Quality: 5 (perfect) if correct, 1 (wrong) if incorrect.
        const quality = isCorrect ? 5 : 1

        // Current values
        let interval = word.interval || 0
        let easeFactor = word.ease_factor || 2.5
        let consecutiveCorrect = word.consecutive_correct || 0

        if (quality >= 3) {
            // Correct response
            if (consecutiveCorrect === 0) {
                interval = 1
            } else if (consecutiveCorrect === 1) {
                interval = 6
            } else {
                interval = Math.round(interval * easeFactor)
            }
            consecutiveCorrect += 1
        } else {
            // Incorrect response
            consecutiveCorrect = 0
            interval = 1
        }

        // Update Ease Factor
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        if (easeFactor < 1.3) easeFactor = 1.3

        // Calculate Next Review Date
        const nextReview = new Date()
        nextReview.setDate(nextReview.getDate() + interval)

        // Update Database
        if (user) {
            await supabase.from('words').update({
                next_review: nextReview.toISOString(),
                interval,
                ease_factor: easeFactor,
                consecutive_correct: consecutiveCorrect
            }).eq('id', word.id)

            // Update local state
            set((state) => ({
                words: state.words.map((w) => w.id === word.id ? {
                    ...w,
                    next_review: nextReview.toISOString(),
                    interval,
                    ease_factor: easeFactor,
                    consecutive_correct: consecutiveCorrect
                } : w)
            }))
        }

        return isCorrect
    },

    nextQuestion: () => {
        const { quizQuestions, currentQuestionIndex } = get()
        if (currentQuestionIndex < quizQuestions.length - 1) {
            set({ currentQuestionIndex: currentQuestionIndex + 1 })
        }
    },

    getDueWords: () => {
        const { words } = get()
        const now = new Date()
        return words.filter(w => {
            if (!w.next_review) return true
            return new Date(w.next_review) <= now
        })
    },

    resetQuiz: () => set({ quizQuestions: [], currentQuestionIndex: 0, score: 0 }),

    startFlashcards: () => set({ flashcardActive: true }),
    exitFlashcards: () => set({ flashcardActive: false }),

    uploadImage: async (file) => {
        const { user } = get()
        if (!user) return null

        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('word-images')
            .upload(filePath, file)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return null
        }

        const { data: { publicUrl } } = supabase.storage
            .from('word-images')
            .getPublicUrl(filePath)

        return publicUrl
    }
}))
