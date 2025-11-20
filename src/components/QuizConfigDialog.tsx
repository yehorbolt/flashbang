import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface QuizConfigDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onStart: (config: QuizConfig) => void
    mode: 'quiz' | 'flashcards'
}

export interface QuizConfig {
    mode: 'new' | 'review' | 'random'
    count: number
    direction: 'german_to_translation' | 'translation_to_german' | 'mixed'
}

export function QuizConfigDialog({ open, onOpenChange, onStart, mode }: QuizConfigDialogProps) {
    const [config, setConfig] = useState<QuizConfig>({
        mode: 'new',
        count: 10,
        direction: 'mixed'
    })

    const handleStart = () => {
        onStart(config)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configure {mode === 'quiz' ? 'Quiz' : 'Flashcards'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Study Mode</Label>
                        <RadioGroup
                            value={config.mode}
                            onValueChange={(val: 'new' | 'review' | 'random') => setConfig({ ...config, mode: val })}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new" id="new" />
                                <Label htmlFor="new">New Words (Linear)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="review" id="review" />
                                <Label htmlFor="review">Smart Review (SRS)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="random" id="random" />
                                <Label htmlFor="random">Random Shuffle</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>Number of Words</Label>
                        <Select
                            value={config.count.toString()}
                            onValueChange={(val) => setConfig({ ...config, count: parseInt(val) })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select count" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 Words</SelectItem>
                                <SelectItem value="20">20 Words</SelectItem>
                                <SelectItem value="50">50 Words</SelectItem>
                                <SelectItem value="100">100 Words</SelectItem>
                                <SelectItem value="9999">All Available</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Direction</Label>
                        <Select
                            value={config.direction}
                            onValueChange={(val: any) => setConfig({ ...config, direction: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select direction" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mixed">Mixed</SelectItem>
                                <SelectItem value="german_to_translation">Word → Translation</SelectItem>
                                <SelectItem value="translation_to_german">Translation → Word</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleStart}>Start {mode === 'quiz' ? 'Quiz' : 'Session'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
