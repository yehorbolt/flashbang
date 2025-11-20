import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

interface CSVRow {
    Word: string
    'Spelling'?: string
    'German Spelling'?: string
    Translation: string
    Category: string
}

export const parseCSV = (file: File): Promise<CSVRow[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data as CSVRow[])
            },
            error: (error) => {
                reject(error)
            },
        })
    })
}

export const importCSV = async (
    rows: CSVRow[],
    existingCategories: Category[],
    userId: string,
    onProgress: (message: string) => void
) => {
    let categories = [...existingCategories]

    for (const row of rows) {
        const categoryName = row.Category?.trim() || 'Uncategorized'
        let category = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())

        if (!category) {
            onProgress(`Creating category: ${categoryName}`)
            const { data, error } = await supabase
                .from('categories')
                .insert([{ name: categoryName, user_id: userId }])
                .select()
                .single()

            if (error) {
                console.error('Error creating category:', error)
                continue
            }

            if (!data) continue
            category = data
            categories.push(data)
        }

        if (!category) continue

        onProgress(`Importing word: ${row.Word}`)
        const { error } = await supabase.from('words').insert([
            {
                german_word: row.Word,
                german_spelling: row['Spelling'] || row['German Spelling'] || null,
                translation: row.Translation,
                category_id: category.id,
                user_id: userId,
            },
        ])

        if (error) {
            console.error('Error importing word:', error)
        }
    }
}

export const generateCSV = (words: any[], categories: Category[]) => {
    const data = words.map((word) => {
        const category = categories.find((c) => c.id === word.category_id)
        return {
            Word: word.german_word,
            'Spelling': word.german_spelling || '',
            Translation: word.translation,
            Category: category ? category.name : 'Uncategorized',
        }
    })

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'flashbang_export.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
