import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { executeCode } from '../code-execution/ExecuteCode';

export class CodeEditor {
    private view: EditorView;
    private container: HTMLElement;
    private onExecuteCallback: ((result: any) => void) | null = null;

    constructor(containerId: string) {
        const editorContainer = document.createElement('div');
        editorContainer.id = 'code-editor-container';
        
        const gameContainer = document.getElementById(containerId);
        if (gameContainer && gameContainer.parentNode) {
            gameContainer.parentNode.insertBefore(editorContainer, gameContainer.nextSibling);
        } else {
            document.body.appendChild(editorContainer);
        }
        
        this.container = editorContainer;
        
        const editorElement = document.createElement('div');
        editorElement.className = 'cm-wrapper';
        editorContainer.appendChild(editorElement);
        
        this.view = new EditorView({
            state: EditorState.create({
                doc: this.getDefaultCode(),
                extensions: [
                    basicSetup,
                    cpp(),
                    oneDark,
                    EditorView.lineWrapping,
                ]
            }),
            parent: editorElement
        });
        
        this.setupExecuteButton();
    }
    
    getCode(): string {
        return this.view.state.doc.toString();
    }
    
    setCode(code: string): void {
        this.view.dispatch({
            changes: {
                from: 0,
                to: this.view.state.doc.length,
                insert: code
            }
        });
    }
    
    onExecute(callback: (result: any) => void): void {
        this.onExecuteCallback = callback;
    }
    
    private async execute(): Promise<void> {
        const code = this.getCode();
        
        if (!code.trim()) {
            if (this.onExecuteCallback) {
                this.onExecuteCallback({ success: false, error: 'Код не может быть пустым' });
            }
            return;
        }
        
        window.setExecuteButtonState(true, '⏳ Выполнение...');
        
        try {
            const result = await executeCode(code);
            if (this.onExecuteCallback) {
                this.onExecuteCallback(result);
            }
        } catch (error) {
            if (this.onExecuteCallback) {
                this.onExecuteCallback({ success: false, error: String(error) });
            }
        } finally {
            window.setExecuteButtonState(false);
        }
    }
    
    private setupExecuteButton(): void {
        window.setExecuteHandler(async () => {
            await this.execute();
        });
    }
    
    private getDefaultCode(): string {
        return `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`;
    }
    
    cleanup(): void {
        const editorContainer = document.getElementById('code-editor-container');
        if (editorContainer) {
            editorContainer.remove();
        }
    }
}