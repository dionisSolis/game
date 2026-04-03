import GigaChat from 'gigachat';

// Гарантируем наличие process и Buffer в браузере
if (typeof globalThis.process === 'undefined') {
    // @ts-ignore
    globalThis.process = {
        env: {},
        version: '',
        release: { lts: '', name: '' },
        cwd: () => '/',
        platform: 'browser',
        nextTick: (fn: any, ...args: any[]) => setTimeout(() => fn(...args), 0),
    };
}

if (typeof globalThis.Buffer === 'undefined') {
    // @ts-ignore
    globalThis.Buffer = {
        from: (str: string) => ({ toString: () => str }),
        isBuffer: () => false,
    };
}

// Глобальный экземпляр клиента (один на всё приложение)
let gigaClient: InstanceType<typeof GigaChat> | null = null;

/**
 * Получение токена из .env файла
 * В .env должно быть: VITE_GIGACHAT_CREDENTIALS=твой_ключ
 */
function getApiKey(): string {
    const key = "MDE5OTYxMTMtNTk3NS03MzA2LThlZWYtM2QxY2QxMjFmMmI4OjI5NTFmOGFiLTc4MWUtNDYyYy05MDY4LWNhYTA0MzgyMTM5OQ";
    if (!key) {
        console.warn('⚠️ VITE_GIGACHAT_CREDENTIALS не задан в .env файле');
        return '';
    }
    return key;
}

/**
 * Инициализация и получение клиента GigaChat
 */
export function getGigaChatClient(): InstanceType<typeof GigaChat> | null {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('❌ Невозможно создать клиент GigaChat: отсутствует API ключ');
        return null;
    }

    if (!gigaClient) {
        try {
            gigaClient = new GigaChat({
                credentials: apiKey,
                dangerouslyAllowBrowser: true,
                // Опциональные настройки
                timeout: 10000, // таймаут 10 секунд
            });
            console.log('✅ GigaChat клиент инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации GigaChat клиента:', error);
            return null;
        }
    }
    return gigaClient;
}

/**
 * Проверка доступности клиента
 */
export function isGigaChatAvailable(): boolean {
    return getGigaChatClient() !== null;
}