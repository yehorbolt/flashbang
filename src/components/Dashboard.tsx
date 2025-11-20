import { useState, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { parseCSV, importCSV, generateCSV } from '@/services/csvService'
import { generateWordDetails } from '@/services/aiService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Upload, Download, Trash2, Play, Edit, LogOut, Settings, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { QuizConfigDialog, type QuizConfig } from './QuizConfigDialog'

export function Dashboard() {
    const {
        categories,
        words,
        user,
        addCategory,
        updateCategory,
        addWord,
        updateWord,
        deleteWord,
        deleteCategory,
        currentCategoryFilter,
        setCategoryFilter,
        startQuiz,
        startFlashcards,
        setUser,
        uploadImage,
        apiKey,
        setApiKey
    } = useStore()

    const [newCategoryName, setNewCategoryName] = useState('')
    const [newWord, setNewWord] = useState({ german_word: '', german_spelling: '', translation: '', category_id: '' })
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [editWord, setEditWord] = useState<{ id: string; german_word: string; german_spelling: string; translation: string; category_id: string | null; image_url?: string | null } | null>(null)
    const [editImageFile, setEditImageFile] = useState<File | null>(null)
    const [editCategory, setEditCategory] = useState<{ id: string; name: string; original_language: string; translation_language: string; is_system: boolean } | null>(null)
    const [quizConfigOpen, setQuizConfigOpen] = useState(false)
    const [configMode, setConfigMode] = useState<'quiz' | 'flashcards'>('quiz')
    const [isImporting, setIsImporting] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [tempApiKey, setTempApiKey] = useState(apiKey || '')
    const [isGenerating, setIsGenerating] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const filteredWords = currentCategoryFilter
        ? words.filter((w) => w.category_id === currentCategoryFilter)
        : words

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return
        await addCategory(newCategoryName)
        setNewCategoryName('')
        toast.success('Category added')
    }

    const handleAddWord = async () => {
        if (!newWord.german_word || !newWord.translation) return
        let categoryId: string | null = newWord.category_id
        if (!categoryId || categoryId === 'uncategorized') {
            const uncategorized = categories.find(c => c.name === 'Uncategorized' && c.is_system)
            categoryId = uncategorized ? uncategorized.id : null
        }
        let imageUrl = null
        if (imageFile) {
            imageUrl = await uploadImage(imageFile)
        }
        await addWord({
            german_word: newWord.german_word,
            german_spelling: newWord.german_spelling || null,
            translation: newWord.translation,
            category_id: categoryId,
            image_url: imageUrl
        })
        setNewWord({ german_word: '', german_spelling: '', translation: '', category_id: '' })
        setImageFile(null)
        toast.success('Word added')
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsImporting(true)
        try {
            const rows = await parseCSV(file)
            await importCSV(rows, categories, user.id, (msg) => toast.info(msg))
            toast.success('Import completed')
            window.location.reload()
        } catch (error) {
            console.error(error)
            toast.error('Import failed')
        }
        setIsImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleEditWord = async () => {
        if (!editWord || !editWord.german_word || !editWord.translation) return
        let categoryId = editWord.category_id
        if (!categoryId || categoryId === 'uncategorized') {
            const uncategorized = categories.find(c => c.name === 'Uncategorized' && c.is_system)
            categoryId = uncategorized ? uncategorized.id : null
        }
        let imageUrl = editWord.image_url
        if (editImageFile) {
            imageUrl = await uploadImage(editImageFile)
        }
        await updateWord(editWord.id, {
            german_word: editWord.german_word,
            german_spelling: editWord.german_spelling || null,
            translation: editWord.translation,
            category_id: categoryId,
            image_url: imageUrl
        })
        setEditWord(null)
        setEditImageFile(null)
        toast.success('Word updated')
    }

    const handleEditCategory = async () => {
        if (!editCategory || !editCategory.name.trim()) return
        await updateCategory(editCategory.id, {
            name: editCategory.name,
            original_language: editCategory.original_language,
            translation_language: editCategory.translation_language
        })
        setEditCategory(null)
        toast.success('Category updated')
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    const handleStartConfig = (mode: 'quiz' | 'flashcards') => {
        setConfigMode(mode)
        setQuizConfigOpen(true)
    }

    const handleStartSession = (config: QuizConfig) => {
        if (configMode === 'quiz') {
            startQuiz(config)
        } else {
            startFlashcards()
        }
        setQuizConfigOpen(false)
    }

    const handleSaveApiKey = () => {
        setApiKey(tempApiKey)
        setSettingsOpen(false)
        toast.success('API Key saved')
    }

    const handleAutoFill = async () => {
        if (!newWord.german_word.trim()) {
            toast.error('Please enter a word first')
            return
        }
        if (!apiKey || apiKey === 'your_api_key_here') {
            toast.error('Please set a valid Gemini API Key in Settings')
            setSettingsOpen(true)
            return
        }

        setIsGenerating(true)
        try {
            const category = categories.find(c => c.id === newWord.category_id)
            const targetLang = category?.translation_language || 'en'

            const details = await generateWordDetails(newWord.german_word, targetLang, apiKey)

            if (details) {
                setNewWord({
                    ...newWord,
                    translation: details.translation,
                    german_spelling: details.german_spelling || ''
                })
                toast.success('Auto-filled successfully!')
            } else {
                toast.error('Failed to generate details. Check console for errors.')
            }
        } catch (error) {
            console.error('Auto-fill error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate details'
            toast.error(errorMessage)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="flex gap-2">
                    <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImport}
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                        <Upload className="mr-2 h-4 w-4" /> Import CSV
                    </Button>
                    <Button variant="outline" onClick={() => generateCSV(words, categories)}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleStartConfig('flashcards')}>
                        <Play className="mr-2 h-4 w-4" /> Start Flashcards
                    </Button>
                    <Button onClick={() => handleStartConfig('quiz')}>
                        <Play className="mr-2 h-4 w-4" /> Start Quiz
                    </Button>
                    <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" /> Settings
                    </Button>
                    <Button variant="destructive" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Log out
                    </Button>
                </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card
                    className={`cursor-pointer hover:bg-accent ${currentCategoryFilter === null ? 'border-primary' : ''}`}
                    onClick={() => setCategoryFilter(null)}
                >
                    <CardHeader>
                        <CardTitle>All Words</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{words.length}</p>
                    </CardContent>
                </Card>
                {categories.map((cat) => (
                    <Card
                        key={cat.id}
                        className={`cursor-pointer hover:bg-accent ${currentCategoryFilter === cat.id ? 'border-primary' : ''}`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="flex-1" onClick={() => setCategoryFilter(cat.id)}>{cat.name}</CardTitle>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setEditCategory(cat)
                                    }}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                {!cat.is_system && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm(`Delete category "${cat.name}"? Words will become uncategorized.`)) {
                                                deleteCategory(cat.id)
                                                toast.success('Category deleted')
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent onClick={() => setCategoryFilter(cat.id)}>
                            <p className="text-2xl font-bold">
                                {words.filter((w) => w.category_id === cat.id).length}
                            </p>
                        </CardContent>
                    </Card>
                ))}

                {/* Add Category Dialog */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Card className="cursor-pointer hover:bg-accent border-dashed flex items-center justify-center h-full min-h-[150px]">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </Card>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Category</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g. Food"
                                />
                            </div>
                            <Button onClick={handleAddCategory}>Create</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Words Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Words</CardTitle>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Word</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Word</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Word</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleAutoFill}
                                            disabled={isGenerating}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            {isGenerating ? 'Generating...' : 'Auto-Fill'}
                                        </Button>
                                    </div>
                                    <Input
                                        value={newWord.german_word}
                                        onChange={(e) => setNewWord({ ...newWord, german_word: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Spelling (Optional)</Label>
                                    <Input
                                        value={newWord.german_spelling}
                                        onChange={(e) => setNewWord({ ...newWord, german_spelling: e.target.value })}
                                        placeholder="e.g., Guten Tag"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Translation</Label>
                                    <Input
                                        value={newWord.translation}
                                        onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={newWord.category_id}
                                        onValueChange={(val) => setNewWord({ ...newWord, category_id: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Image (Optional)</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                                <Button onClick={handleAddWord}>Add Word</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Word</TableHead>
                                <TableHead>Translation</TableHead>
                                <TableHead>Image</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredWords.map((word) => (
                                <TableRow key={word.id}>
                                    <TableCell className="font-medium">{word.german_word}</TableCell>
                                    <TableCell>{word.translation}</TableCell>
                                    <TableCell>
                                        {word.image_url && (
                                            <img src={word.image_url} alt={word.german_word} className="h-10 w-10 object-cover rounded" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {categories.find((c) => c.id === word.category_id)?.name || 'Uncategorized'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditWord({
                                                    id: word.id,
                                                    german_word: word.german_word,
                                                    german_spelling: word.german_spelling || '',
                                                    translation: word.translation,
                                                    category_id: word.category_id,
                                                    image_url: word.image_url
                                                })}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteWord(word.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredWords.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No words found. Add some or import a CSV!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Word Dialog */}
            <Dialog open={!!editWord} onOpenChange={(open) => !open && setEditWord(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Word</DialogTitle>
                    </DialogHeader>
                    {editWord && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Word</Label>
                                <Input
                                    value={editWord.german_word}
                                    onChange={(e) => setEditWord({ ...editWord, german_word: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Spelling (Optional)</Label>
                                <Input
                                    value={editWord.german_spelling}
                                    onChange={(e) => setEditWord({ ...editWord, german_spelling: e.target.value })}
                                    placeholder="e.g., Guten Tag"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Translation</Label>
                                <Input
                                    value={editWord.translation}
                                    onChange={(e) => setEditWord({ ...editWord, translation: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={editWord.category_id || categories.find(c => c.name === 'Uncategorized' && c.is_system)?.id || ''}
                                    onValueChange={(val) => setEditWord({ ...editWord, category_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Image (Optional)</Label>
                                <div className="flex gap-4 items-center">
                                    {editWord.image_url && (
                                        <img src={editWord.image_url} alt="Current" className="h-12 w-12 object-cover rounded" />
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleEditWord}>Save Changes</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Category Dialog */}
            <Dialog open={!!editCategory} onOpenChange={(open) => !open && setEditCategory(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    {editCategory && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={editCategory.name}
                                    onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                                    disabled={editCategory.is_system}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Original Language</Label>
                                <Select
                                    value={editCategory.original_language}
                                    onValueChange={(val) => setEditCategory({ ...editCategory, original_language: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="de">German</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="es">Spanish</SelectItem>
                                        <SelectItem value="fr">French</SelectItem>
                                        <SelectItem value="it">Italian</SelectItem>
                                        <SelectItem value="pl">Polish</SelectItem>
                                        <SelectItem value="uk">Ukrainian</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Translation Language</Label>
                                <Select
                                    value={editCategory.translation_language}
                                    onValueChange={(val) => setEditCategory({ ...editCategory, translation_language: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="es">Spanish</SelectItem>
                                        <SelectItem value="fr">French</SelectItem>
                                        <SelectItem value="it">Italian</SelectItem>
                                        <SelectItem value="pl">Polish</SelectItem>
                                        <SelectItem value="uk">Ukrainian</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleEditCategory}>Save Changes</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Quiz Config Dialog */}
            <QuizConfigDialog
                open={quizConfigOpen}
                onOpenChange={setQuizConfigOpen}
                onStart={handleStartSession}
                mode={configMode}
            />

            {/* Settings Dialog */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Gemini API Key</Label>
                            <Input
                                type="password"
                                value={tempApiKey}
                                onChange={(e) => setTempApiKey(e.target.value)}
                                placeholder="Enter your Gemini API key"
                            />
                            <p className="text-sm text-muted-foreground">
                                Get your free API key from{' '}
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                >
                                    Google AI Studio
                                </a>
                            </p>
                        </div>
                        <Button onClick={handleSaveApiKey}>Save</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
