export interface GigaChatConfig {
    apiUrl: string;
    timeout?: number;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatRequest {
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
}

export interface ChatResponse {
    choices: Array<{
        message: {
            content: string;
            role: string;
        };
        index: number;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface GigaChatClient {
    chat(request: ChatRequest): Promise<ChatResponse>;
}

export function createGigaChatClient(config: GigaChatConfig): GigaChatClient {
    const { apiUrl, timeout = 60000 } = config;

    return {
        async chat(request: ChatRequest): Promise<ChatResponse> {
            const userMessage = request.messages.find(m => m.role === 'user')?.content || '';
            
            const systemMessage = request.messages.find(m => m.role === 'system')?.content;
            const finalMessage = systemMessage 
                ? `${systemMessage}\n\nИгрок: ${userMessage}`
                : userMessage;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: finalMessage }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Сервер GigaChat вернул ошибку ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                
                return data as ChatResponse;
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    throw new Error('Превышено время ожидания ответа от ИИ');
                }
                console.error('GigaChat request failed:', error);
                throw error;
            }
        },
    };
}

let clientInstance: GigaChatClient | null = null;

export function getGigaChatClient(apiUrl: string = 'https://gigachat-typescript-server.onrender.com/chat'): GigaChatClient | null {
    if (!clientInstance) {
        clientInstance = createGigaChatClient({ apiUrl });
    }
    return clientInstance;
}

export async function checkGigaChatAvailable(apiUrl: string = 'https://gigachat-typescript-server.onrender.com/chat'): Promise<boolean> {
    try {
        const response = await fetch(`${apiUrl}/`, { method: 'GET', signal: AbortSignal.timeout(2000) });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Синхронная версия проверки (для isAvailable - быстро возвращает true, если клиент создан)
 */
export function isGigaChatAvailable(): boolean {
    return clientInstance !== null;
}