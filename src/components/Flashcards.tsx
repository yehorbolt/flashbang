import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2, Sparkles } from 'lucide-react'
import { generateExampleSentence, type ExampleSentence } from '@/services/aiService'
import { toast } from 'sonner'

export function Flashcards({ onExit }: { onExit: () => void }) {
    const { words, categories, currentCategoryFilter, apiKey } = useStore()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [exampleSentence, setExampleSentence] = useState<ExampleSentence | null>(null)
    const [isGeneratingSentence, setIsGeneratingSentence] = useState(false)

    const filteredWords = currentCategoryFilter
        ? words.filter((w) => w.category_id === currentCategoryFilter)
        : words

    const currentWord = filteredWords[currentIndex]

    useEffect(() => {
        setIsFlipped(false)
        setExampleSentence(null)  // Clear sentence when card changes
    }, [currentIndex])

    const handleNext = () => {
        if (currentIndex < filteredWords.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    const speakText = (text: string, lang: string = 'de-DE') => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = lang
            utterance.rate = 0.9
            window.speechSynthesis.speak(utterance)
        }
    }

    const handleGenerateSentence = async () => {
        if (!apiKey || apiKey === 'your_api_key_here') {
            toast.error('Please set a valid Gemini API Key in Settings')
            return
        }

        setIsGeneratingSentence(true)
        try {
            const category = categories.find(c => c.id === currentWord.category_id)
            const originalLang = category?.original_language || 'de'
            const translationLang = category?.translation_language || 'en'

            const sentence = await generateExampleSentence(
                currentWord.german_word,
                originalLang,
                translationLang,
                apiKey
            )

            if (sentence) {
                setExampleSentence(sentence)
                toast.success('Example sentence generated!')
            } else {
                toast.error('Failed to generate sentence')
            }
        } catch (error) {
            console.error('Sentence generation error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate sentence'
            toast.error(errorMessage)
        } finally {
            setIsGeneratingSentence(false)
        }
    }

    if (!currentWord) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <h2 className="text-2xl font-bold">No words available</h2>
                <p className="text-muted-foreground">Add some words to start studying!</p>
                <Button onClick={onExit}>Back to Dashboard</Button>
            </div>
        )
    }

    const progress = ((currentIndex + 1) / filteredWords.length) * 100

    return (
        <div className="container mx-auto p-2 sm:p-4 max-w-2xl h-full flex flex-col justify-center">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Button className="touch-target" variant="ghost" onClick={onExit}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Exit
                </Button>
                <div className="flex items-center gap-3 sm:gap-4">
                    <Badge variant="outline" className="text-sm">
                        {currentIndex + 1} / {filteredWords.length}
                    </Badge>
                    <Progress value={progress} className="w-[80px] sm:w-[100px]" />
                </div>
            </div>

            <Card
                className="w-full cursor-pointer transition-transform hover:scale-105"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <CardHeader className="text-center">
                    <CardTitle className="text-sm text-muted-foreground">
                        {isFlipped ? 'Translation' : 'Word'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                    {!isFlipped && currentWord.image_url && (
                        <img
                            src={currentWord.image_url}
                            alt={currentWord.german_word}
                            className="h-48 w-auto object-contain rounded-md mb-4"
                        />
                    )}
                    <p className="text-5xl font-bold text-center">
                        {isFlipped ? currentWord.translation : currentWord.german_word}
                    </p>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            const category = categories.find(c => c.id === currentWord.category_id)
                            const lang = isFlipped
                                ? (category?.translation_language || 'en')
                                : (category?.original_language || 'de')

                            speakText(
                                isFlipped ? currentWord.translation : currentWord.german_word,
                                lang
                            )
                        }}
                    >
                        <Volume2 className="h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <Button
                    className="touch-target"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button
                    className="touch-target"
                    onClick={() => setIsFlipped(!isFlipped)}
                    variant="secondary"
                >
                    Flip Card
                </Button>
                <Button
                    className="touch-target"
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentIndex === filteredWords.length - 1}
                >
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>

            {/* Example Sentence Section */}
            <div className="mt-4 sm:mt-6">
                {!exampleSentence ? (
                    <Button
                        variant="outline"
                        className="w-full touch-target text-sm sm:text-base"
                        onClick={handleGenerateSentence}
                        disabled={isGeneratingSentence}
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isGeneratingSentence ? 'Generating...' : 'Generate Example Sentence'}
                    </Button>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground flex justify-between items-center">
                                Example Sentence
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExampleSentence(null)}
                                >
                                    Clear
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-1">Original:</p>
                                <p className="text-lg">{exampleSentence.sentence}</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1"
                                    onClick={() => {
                                        const category = categories.find(c => c.id === currentWord.category_id)
                                        const lang = category?.original_language || 'de'
                                        speakText(exampleSentence.sentence, lang)
                                    }}
                                >
                                    <Volume2 className="h-4 w-4 mr-1" /> Listen
                                </Button>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-1">Translation:</p>
                                <p className="text-lg text-muted-foreground">{exampleSentence.translation}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
