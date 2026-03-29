const SAVE_KEY = 'magic-library-save';

export interface SaveData {
    completedLevels: string[];   
    unlockedBooks:   string[];  
}

const DEFAULT_SAVE: SaveData = {
    completedLevels: [],
    unlockedBooks:   [],
};

export const SaveManager = {

    load(): SaveData {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return { ...DEFAULT_SAVE };
            return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
        } catch {
            return { ...DEFAULT_SAVE };
        }
    },

    save(data: SaveData): void {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    },

    markLevelComplete(levelId: string): void {
        const data = this.load();
        if (!data.completedLevels.includes(levelId)) {
            data.completedLevels.push(levelId);
            this.save(data);
        }
    },

    isLevelComplete(levelId: string): boolean {
        return this.load().completedLevels.includes(levelId);
    },

    unlockBook(bookName: string): void {
        const data = this.load();
        if (!data.unlockedBooks.includes(bookName)) {
            data.unlockedBooks.push(bookName);
            this.save(data);
        }
    },

    reset(): void {
        localStorage.removeItem(SAVE_KEY);
    },
};
