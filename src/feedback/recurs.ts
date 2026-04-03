export interface FeedbackResult {
    message: string;
    type: 'success' | 'error';
}

/**
 * Простая шаблонная обратная связь для уровня "Стек"
 * @param success - true если код выполнен без ошибок и есть команды
 * @param errorDetail - детали ошибки (stderr или сообщение от Judge0)
 */
export function getStackLevelFeedback(success: boolean, errorDetail?: string): FeedbackResult {
    if (success) {
        return {
            message: "✨ Отлично! Ты правильно использовал стек. Книги сложились в нужном порядке! Так держать, программист.",
            type: 'success'
        };
    } else {
        let theory = "📚 Напомним: стек работает по принципу LIFO (Last In — First Out). Последняя положенная книга забирается первой. Используй push() чтобы положить книгу, и pop() чтобы взять верхнюю.";
        
        if (errorDetail) {
            const shortError = errorDetail.length > 200 
                ? errorDetail.substring(0, 200) + "..."
                : errorDetail;
            return {
                message: `❌ Ошибка: ${shortError}\n\n${theory}`,
                type: 'error'
            };
        }
        
        return {
            message: `❌ Что-то пошло не так. Попробуй ещё раз.\n\n${theory}`,
            type: 'error'
        };
    }
}