export interface Category {
    id: string
    user_id: string
    name: string
    original_language: string
    translation_language: string
    is_system: boolean
    created_at?: string
}

export interface Word {
    id: string
    user_id: string
    german_word: string
    german_spelling?: string | null
    translation: string
    category_id: string | null
    created_at?: string
    next_review?: string | null
    interval?: number
    ease_factor?: number
    consecutive_correct?: number
    image_url?: string | null
}

export interface QuizQuestion {
    word: Word
    options: string[]
    correctOption: string
    type: 'german_to_translation' | 'translation_to_german'
}
