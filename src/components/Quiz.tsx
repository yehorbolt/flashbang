import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { ArrowLeft, Volume2 } from 'lucide-react'

export function Quiz({ onExit }: { onExit: () => void }) {
    const {
        quizQuestions,
        currentQuestionIndex,
        score,
        submitAnswer,
        nextQuestion,
        resetQuiz,
        categories
    } = useStore()

    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [showResult, setShowResult] = useState(false)

    const currentQuestion = quizQuestions[currentQuestionIndex]

    useEffect(() => {
        // Reset local state when question changes
        setSelectedOption(null)
        setShowResult(false)
    }, [currentQuestionIndex])

    if (!currentQuestion) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <h2 className="text-2xl font-bold">Quiz Finished!</h2>
                <p className="text-xl">Score: {score} / {quizQuestions.length}</p>
                <div className="flex gap-4">
                    <Button onClick={onExit} variant="outline">Back to Dashboard</Button>
                    <Button onClick={() => { resetQuiz(); onExit(); }}>New Quiz</Button>
                </div>
            </div>
        )
    }

    const handleOptionClick = async (option: string) => {
        if (showResult) return
        setSelectedOption(option)
        const correct = await submitAnswer(option)
        setShowResult(true)

        if (correct) {
            toast.success('Correct!')
        } else {
            toast.error(`Incorrect! The answer was: ${currentQuestion.correctOption}`)
        }
    }

    const speakText = (text: string, lang: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = lang
            utterance.rate = 0.9
            window.speechSynthesis.speak(utterance)
        }
    }

    const progress = ((currentQuestionIndex) / quizQuestions.length) * 100

    return (
        <div className="container mx-auto p-4 max-w-2xl h-full flex flex-col justify-center">
            <div className="mb-6 flex items-center justify-between">
                <Button variant="ghost" onClick={onExit}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Exit
                </Button>
                <div className="flex items-center gap-4">
                    <span className="font-bold">Score: {score}</span>
                    <Progress value={progress} className="w-[100px]" />
                </div>
            </div>

            <Card className="w-full">
                <CardHeader className="text-center space-y-4">
                    <Badge variant="outline" className="w-fit mx-auto">
                        Question {currentQuestionIndex + 1} / {quizQuestions.length}
                    </Badge>
                    {currentQuestion.word.image_url && (
                        <div className="flex justify-center mb-4">
                            <img
                                src={currentQuestion.word.image_url}
                                alt="Quiz Image"
                                className="h-48 w-auto object-contain rounded-md"
                            />
                        </div>
                    )}
                    <CardTitle className="text-4xl font-bold py-8">
                        {currentQuestion.type === 'german_to_translation'
                            ? currentQuestion.word.german_word
                            : currentQuestion.word.translation}
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const text = currentQuestion.type === 'german_to_translation'
                                ? currentQuestion.word.german_word
                                : currentQuestion.word.translation

                            const category = categories.find(c => c.id === currentQuestion.word.category_id)
                            const lang = currentQuestion.type === 'german_to_translation'
                                ? (category?.original_language || 'de')
                                : (category?.translation_language || 'en')

                            speakText(text, lang)
                        }}
                    >
                        <Volume2 className="mr-2 h-4 w-4" /> Play Audio
                    </Button>
                    <p className="text-muted-foreground">
                        Select the correct {currentQuestion.type === 'german_to_translation' ? 'translation' : 'German word'}
                    </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, idx) => (
                        <Button
                            key={idx}
                            variant={
                                showResult
                                    ? option === currentQuestion.correctOption
                                        ? 'default' // Correct answer shown in green-ish (default primary)
                                        : option === selectedOption
                                            ? 'destructive' // Wrong selection shown in red
                                            : 'outline'
                                    : selectedOption === option
                                        ? 'secondary'
                                        : 'outline'
                            }
                            className={`h-24 text-lg whitespace-normal ${showResult && option === currentQuestion.correctOption ? 'bg-green-600 hover:bg-green-700 text-white' : ''
                                }`}
                            onClick={() => handleOptionClick(option)}
                            disabled={showResult}
                        >
                            {option}
                        </Button>
                    ))}
                </CardContent>
                <CardFooter className="justify-center">
                    {showResult && (
                        <Button onClick={() => {
                            if (currentQuestionIndex < quizQuestions.length - 1) {
                                nextQuestion()
                            } else {
                                // Quiz is finished
                                onExit()
                            }
                        }}>
                            {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
