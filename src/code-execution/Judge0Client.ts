// Judge0 CE API endpoint (public no auth token)
const JUDGE0_API_URL = 'https://ce.judge0.com/submissions';

const DEFAULT_LANGUAGE_ID = 52;

export interface Judge0Result {
    success: boolean;
    output?: string;
    error?: string;
}

function toBase64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(str: string): string {
    return decodeURIComponent(escape(atob(str)));
}

export async function executeCppCode(code: string): Promise<Judge0Result> {
    try {
        const encodedCode = toBase64(code);

        const submitResponse = await fetch(`${JUDGE0_API_URL}?base64_encoded=true&wait=true`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_code: encodedCode,
                language_id: DEFAULT_LANGUAGE_ID,
                stdin: '',
                expected_output: null,
                cpu_time_limit: 2,
                memory_limit: 128000,
            }),
        });

        if (!submitResponse.ok) {
            const errorText = await submitResponse.text();
            return {
                success: false,
                error: `Judge0 API ошибка (${submitResponse.status}): ${errorText}`,
            };
        }

        const submission = await submitResponse.json();

        // status.id: 3 = Accepted (успешно), 6 = Compilation Error, остальные — ошибки
        if (submission.status && submission.status.id !== 3) {
            let compileOutput = '';
            let stderr = '';
            
            if (submission.compile_output) {
                compileOutput = fromBase64(submission.compile_output);
            }
            if (submission.stderr) {
                stderr = fromBase64(submission.stderr);
            }
            
            const errorMessage = compileOutput || stderr || submission.status.description || 'Ошибка выполнения';
            return {
                success: false,
                error: errorMessage,
            };
        }

        let stdout = '';
        if (submission.stdout) {
            stdout = fromBase64(submission.stdout);
        }

        return {
            success: true,
            output: stdout,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Неизвестная ошибка сети',
        };
    }
}