import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLanguageStore = create(
    persist(
        (set) => ({
            language: 'en', // default language
            setLanguage: (lang) => set({ language: lang }),
        }),
        {
            name: 'language-storage', // name of the item in the storage (must be unique)
        }
    )
);
