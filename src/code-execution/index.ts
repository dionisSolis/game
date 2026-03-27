import { executeCppCode } from './Judge0Client';
import { parseOutput } from './OutputParser';
import type { Command } from './OutputParser';

export interface ExecutionResult {
    success: boolean;
    commands?: Command[];
    error?: string;
    rawOutput?: string;
}

export async function executeCode(code: string): Promise<ExecutionResult> {
    const pistonResult = await executeCppCode(code);
    
    if (!pistonResult.success) {
        return {
            success: false,
            error: pistonResult.error || 'Ошибка выполнения кода',
        };
    }

    const output = pistonResult.output || '';
    const commands = parseOutput(output);

    if (commands.length === 0) {
        return {
            success: false,
            error: 'Программа не сгенерировала команд. Используйте PUSH:название или POP',
            rawOutput: output,
        };
    }

    return {
        success: true,
        commands,
        rawOutput: output,
    };
}