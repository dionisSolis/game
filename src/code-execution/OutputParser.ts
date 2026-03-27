export type Command = 
    | { type: 'PUSH'; bookName: string }
    | { type: 'POP' }
    | { type: 'UNKNOWN'; raw: string };

export function parseOutput(output: string): Command[] {
    const lines = output.split('\n');
    const commands: Command[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('PUSH:')) {
            const bookName = trimmed.substring(5).trim();
            if (bookName) {
                commands.push({ type: 'PUSH', bookName });
            }
        } 
        else if (trimmed === 'POP') {
            commands.push({ type: 'POP' });
        }
        else if (trimmed.length > 0) {
            commands.push({ type: 'UNKNOWN', raw: trimmed });
        }
    }

    return commands;
}