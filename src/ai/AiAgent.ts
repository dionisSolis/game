import { getGigaChatClient, isGigaChatAvailable } from './Gigachat';
import {
    SYSTEM_PROMPT_LEVEL_1,
    getHintPrompt,
    getFeedbackPrompt,
    getGreetingPrompt,
} from './prompts';

export interface AIResponse {
    success: boolean;
    text: string;
    error?: string;
}

/**
 * Главный класс для работы с ИИ-агентом (Кошка Рекурсия)
 * Использует паттерн Singleton
 */
export class AIAgent {
    private static instance: AIAgent;
    private client: any;

    private constructor() {
        this.client = getGigaChatClient();
    }

    /**
     * Получить экземпляр AIAgent
     */
    public static getInstance(): AIAgent {
        if (!AIAgent.instance) {
            AIAgent.instance = new AIAgent();
        }
        return AIAgent.instance;
    }

    /**
     * Проверка, доступен ли ИИ
     */
    public isAvailable(): boolean {
        return isGigaChatAvailable() && this.client !== null;
    }

    /**
     * Внутренний метод для отправки запроса в GigaChat
     */
    private async sendRequest(prompt: string): Promise<string> {
        if (!this.isAvailable()) {
            return 'Мяу... магия не работает. Проверь подключение к интернету, а я пока пойду ловить мышей.';
        }

        try {
            const response = await this.client.chat({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT_LEVEL_1 },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 300,
            });

            const text = response.choices?.[0]?.message?.content;
            if (text) {
                return text.trim();
            }
            return 'Мяу... я задумалась. Попробуй ещё раз.';
        } catch (error: any) {
            console.error('GigaChat API error:', error);
            const errorMsg = error?.message || String(error);
            return `Мяу... что-то пошло не так: ${errorMsg.substring(0, 100)}. Но ты всё равно молодец, продолжай!`;
        }
    }

    /**
     * Получить подсказку по коду (после выполнения или по запросу)
     * @param playerCode - код, который написал игрок
     * @param compileError - ошибка компиляции (если есть)
     * @param isCodeCorrect - правильный ли код (логически)
     */
    async getHint(
        playerCode: string,
        compileError: string | null,
        isCodeCorrect: boolean
    ): Promise<AIResponse> {
        const prompt = getHintPrompt(playerCode, compileError, isCodeCorrect);
        const text = await this.sendRequest(prompt);
        return { success: true, text };
    }

    /**
     * Получить обратную связь после выполнения кода
     * @param playerCode - код игрока
     * @param commands - сгенерированные команды (PUSH/POP)
     * @param expectedOrder - ожидаемый порядок книг
     * @param success - успешно ли выполнено задание
     */
    async getCodeFeedback(
        playerCode: string,
        commands: string[],
        expectedOrder: string[],
        success: boolean
    ): Promise<AIResponse> {
        const prompt = getFeedbackPrompt(playerCode, commands, expectedOrder, success);
        const text = await this.sendRequest(prompt);
        return { success: true, text };
    }

    /**
     * Приветствие при входе на уровень
     * @param playerName - имя игрока (опционально)
     */
    async greetPlayer(): Promise<AIResponse> {
        const prompt = getGreetingPrompt();
        const text = await this.sendRequest(prompt);
        return { success: true, text };
    }

    /**
     * Универсальный метод для произвольного вопроса
     */
    async ask(question: string): Promise<AIResponse> {
        const text = await this.sendRequest(question);
        return { success: true, text };
    }
}

export const aiAgent = AIAgent.getInstance();