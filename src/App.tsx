import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { supabase } from '@/lib/supabase'
import { Auth } from '@/components/Auth'
import { Dashboard } from '@/components/Dashboard'
import { Quiz } from '@/components/Quiz'
import { Flashcards } from '@/components/Flashcards'
import { Toaster } from '@/components/ui/sonner'
import { Loader2 } from 'lucide-react'

function App() {
  const { user, setUser, fetchData, loading, quizQuestions, flashcardActive } = useStore()

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchData()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchData()
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, fetchData])

  if (loading && !user) {
    // Initial loading state if needed, but usually we just show auth or dashboard
    // But fetchData sets loading=true.
    // If user is logged in, we might want to show a loader while fetching data.
  }

  if (!user) {
    return (
      <>
        <Auth />
        <Toaster />
      </>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      {quizQuestions.length > 0 ? (
        <Quiz onExit={() => useStore.getState().resetQuiz()} />
      ) : flashcardActive ? (
        <Flashcards onExit={() => useStore.getState().exitFlashcards()} />
      ) : (
        <Dashboard />
      )}
      <Toaster />
    </>
  )
}

export default App
