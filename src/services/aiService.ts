import { GoogleGenerativeAI } from '@google/generative-ai'

export interface WordDetails {
    translation: string
    german_spelling: string | null
    translation_spelling: string | null
    gender: string | null
    example_sentence: string | null
}

export const generateWordDetails = async (
    germanWord: string,
    targetLang: string,
    apiKey: string
): Promise<WordDetails | null> => {
    try {
        if (!apiKey || apiKey === 'your_api_key_here') {
            console.error('Invalid API key')
            throw new Error('Please set a valid Gemini API key in Settings')
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

        const prompt = `You are a German language expert. I will give you a German word, and you will provide details about it for a flashcard app.

Target Language for translation: ${targetLang} (e.g., 'en' for English, 'es' for Spanish).
German Word: "${germanWord}"

Please return a JSON object with the following fields:
- "translation": The translation of the word in the target language.
- "german_spelling": The phonetic spelling or pronunciation guide for the German word (optional, null if not needed).
- "translation_spelling": The phonetic spelling or pronunciation guide for the translation (optional, null if not needed).
- "gender": The grammatical gender of the German word (e.g., "der", "die", "das") if applicable, otherwise null.
- "example_sentence": A simple example sentence in German using the word.

Return ONLY the JSON object, no markdown formatting, no explanations.`

        console.log('Sending request to Gemini API...')
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        console.log('Raw API response:', text)

        // Clean up potential markdown code blocks and whitespace
        let jsonString = text.trim()
        jsonString = jsonString.replace(/```json\n?/g, '')
        jsonString = jsonString.replace(/```\n?/g, '')
        jsonString = jsonString.trim()

        console.log('Cleaned JSON string:', jsonString)

        const parsed = JSON.parse(jsonString) as WordDetails
        console.log('Parsed result:', parsed)

        return parsed
    } catch (error) {
        console.error('Error generating word details:', error)
        if (error instanceof Error) {
            throw error
        }
        throw new Error('Failed to generate word details. Please check your API key and try again.')
    }
}

export interface ExampleSentence {
    sentence: string
    translation: string
}

export const generateExampleSentence = async (
    word: string,
    originalLang: string,
    translationLang: string,
    apiKey: string
): Promise<ExampleSentence | null> => {
    try {
        if (!apiKey || apiKey === 'your_api_key_here') {
            throw new Error('Please set a valid Gemini API key in Settings')
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

        const prompt = `Create a simple example sentence using the word "${word}" in ${originalLang === 'de' ? 'German' : originalLang}.
Then translate it to ${translationLang === 'en' ? 'English' : translationLang}.

Return ONLY a JSON object with these fields:
- "sentence": The example sentence in the original language
- "translation": The translation of the sentence

Keep the sentence simple and natural. Return ONLY the JSON, no markdown formatting.`

        console.log('Generating example sentence...')
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        console.log('Raw sentence response:', text)

        // Clean up potential markdown code blocks
        let jsonString = text.trim()
        jsonString = jsonString.replace(/```json\n?/g, '')
        jsonString = jsonString.replace(/```\n?/g, '')
        jsonString = jsonString.trim()

        console.log('Cleaned sentence JSON:', jsonString)

        const parsed = JSON.parse(jsonString) as ExampleSentence
        console.log('Parsed sentence:', parsed)

        return parsed
    } catch (error) {
        console.error('Error generating example sentence:', error)
        if (error instanceof Error) {
            throw error
        }
        throw new Error('Failed to generate example sentence')
    }
}

