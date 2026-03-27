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
    const judge0Result = await executeCppCode(code);
    
    if (!judge0Result.success) {
        return {
            success: false,
            error: judge0Result.error || 'Ошибка выполнения кода',
        };
    }

    const output = judge0Result.output || '';
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