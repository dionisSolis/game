import Phaser from 'phaser';
import { Book, DEFAULT_BOOK_H } from '../objects/Book';
import { SaveManager } from '../utils/SaveManager';
import { CodeEditor } from '../ui/CodeEditor';
import { aiAgent } from '../ai/AiAgent';


const SOURCE_BOOKS = [
    { name: '1984',        significance: 3, colorIndex: 2 },
    { name: 'Дикий Веперь', significance: 1, colorIndex: 0 },
    { name: 'Стихи',       significance: 4, colorIndex: 3 },
    { name: 'Идиот',       significance: 2, colorIndex: 1 },
];

const BOOK_CUSTOM_SIZES: Record<string, { width: number; height: number }> = {
    '1984': { width: 180, height: 70 },
    'Дикий Веперь': { width: 350, height: 120 },
    'Стихи': { width: 100, height: 50 },
    'Идиот': { width: 250, height: 100 },
};

const TARGET_ORDER = ['Дикий Веперь', 'Идиот', '1984', 'Стихи'];

const STACK_GAP    = -30;  
const BUBBLE_TOP_Y = 130;
const BUBBLE_H     = 220;


export class LevelStackScene extends Phaser.Scene {
    private sourceBooks: Map<string, Book> = new Map();
    private destStack:   Book[]            = [];
    private editor:      CodeEditor | null = null;
    private executing    = false;

    private bubbleBg:      Phaser.GameObjects.Graphics | null = null;
    private bubbleNameBg:  Phaser.GameObjects.Graphics | null = null;
    private bubbleNameText:Phaser.GameObjects.Text     | null = null;
    private bubbleTextDiv: HTMLDivElement               | null = null;
    private chatWidget:    HTMLElement                  | null = null;
    private chatInput:     HTMLInputElement             | null = null;
    private chatBtn:       HTMLButtonElement            | null = null;
    private hubButton:     HTMLElement                  | null = null;
    private levelComplete  = false;
    private victoryAiText  = '';

    constructor() { super({ key: 'LevelStackScene' }); }


    create() {
        window.setGameHalfWidth();

        const w = this.scale.width;
        const h = this.scale.height;

        this.add.rectangle(w / 2, h / 2, w, h, 0x1a1a2e);

        try {
            this.add.image(w / 2, h / 2, 'bg-level').setDisplaySize(w, h);
        } catch { }

        this.drawLabels(w, h);
        this.spawnSourceBooks();
        this.createBackButton();

        this.injectStyles();
        this.createSpeechBubble(w, h);
        this.createChatWidget();
        this.greetAsync();

        this.editor = new CodeEditor('game-container');
        window.showExecuteButton(true);
        this.editor.onExecute(r => this.handleExecutionResult(r));
        this.editor.onChange(() => {
            if (this.levelComplete) {
                window.setExecuteButtonState(false, '▶ Код изменён — запустить снова?');
            }
        });

        const savedCode = SaveManager.loadCode('stack');
        if (savedCode) this.editor.setCode(savedCode);
    }


    private createSpeechBubble(w: number, _h: number): void {
        this.bubbleBg = this.add.graphics().setDepth(8).setAlpha(0);

        this.bubbleNameBg = this.add.graphics().setDepth(9).setAlpha(0);
        this.bubbleNameBg.fillStyle(0x1a1a3a, 0.95);
        this.bubbleNameBg.fillRoundedRect(w * 0.76 - 72, BUBBLE_TOP_Y - 28, 144, 24, 5);
        this.bubbleNameBg.lineStyle(1, 0x6655aa, 0.8);
        this.bubbleNameBg.strokeRoundedRect(w * 0.76 - 72, BUBBLE_TOP_Y - 28, 144, 24, 5);
        this.bubbleNameText = this.add.text(w * 0.76, BUBBLE_TOP_Y - 16, '🐱 Рекурсия', {
            fontSize: '20px',
            fontFamily: 'pixel',
            color: '#ccaaff',
        }).setOrigin(0.5, 0.5).setDepth(10).setAlpha(0);

        const div = document.createElement('div');
        div.style.cssText = [
            'position:fixed',
            'overflow-y:auto',
            'color:#e0e0ff',
            'font-family:"Press Start 2P",monospace',
            'font-size:13px',
            'line-height:1.6',
            'z-index:20',
            'display:none',
            'scrollbar-width:thin',
            'scrollbar-color:#334455 transparent',
        ].join(';');
        document.body.appendChild(div);
        this.bubbleTextDiv = div;
    }

    private formatText(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    }

    private showSpeechBubble(message: string, isError: boolean): void {
        if (!this.bubbleBg || !this.bubbleTextDiv) return;
        this.drawBubble(isError);
        this.positionDiv();

        this.bubbleTextDiv.innerHTML = '';
        if (this.levelComplete && this.victoryAiText) {
            const header = document.createElement('div');
            header.style.cssText = 'color:#44ff88;font-weight:bold;font-size:14px;margin-bottom:8px;';
            header.textContent = '✓ Уровень пройден!';
            this.bubbleTextDiv.appendChild(header);

            if (message === this.victoryAiText) {
                const msg = document.createElement('div');
                msg.innerHTML = this.formatText(message);
                this.bubbleTextDiv.appendChild(msg);
                this.bubbleTextDiv.scrollTop = 0;
            } else {
                const bannerMsg = document.createElement('div');
                bannerMsg.style.marginBottom = '8px';
                bannerMsg.innerHTML = this.formatText(this.victoryAiText);
                this.bubbleTextDiv.appendChild(bannerMsg);

                const label = document.createElement('div');
                label.style.cssText = 'color:#aaaacc;font-size:10px;margin:6px 0 4px;';
                label.textContent = '~ Рекурсия отвечает ~';
                this.bubbleTextDiv.appendChild(label);

                const chatMsg = document.createElement('div');
                chatMsg.innerHTML = this.formatText(message);
                this.bubbleTextDiv.appendChild(chatMsg);

                this.bubbleTextDiv.scrollTop = this.bubbleTextDiv.scrollHeight;
            }
        } else {
            this.bubbleTextDiv.innerHTML = this.formatText(message);
            this.bubbleTextDiv.scrollTop = 0;
        }

        this.bubbleTextDiv.style.display = 'block';
    }

    private hideSpeechBubble(): void {
        if (this.bubbleBg)       this.bubbleBg.setAlpha(0);
        if (this.bubbleNameBg)   this.bubbleNameBg.setAlpha(0);
        if (this.bubbleNameText) this.bubbleNameText.setAlpha(0);
        if (this.bubbleTextDiv)  this.bubbleTextDiv.style.display = 'none';
    }

    private injectStyles(): void {
        if (document.getElementById('recursion-bubble-styles')) return;
        const style = document.createElement('style');
        style.id = 'recursion-bubble-styles';
        style.textContent = `
            @keyframes thinking-bounce {
                0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
                40%           { opacity: 1;    transform: translateY(-5px); }
            }
            .thinking-dot {
                display: inline-block;
                width: 9px; height: 9px;
                border-radius: 50%;
                background: #ccaaff;
                margin: 0 4px;
                animation: thinking-bounce 1.3s infinite ease-in-out;
            }
            .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
            .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
        `;
        document.head.appendChild(style);
    }

    private drawBubble(isError: boolean): void {
        if (!this.bubbleBg) return;
        const w  = this.scale.width;
        const bW = w * 0.42;
        const cx = w * 0.76;
        const r  = 10;
        const borderColor = isError ? 0xaa3333 : 0x33aa77;
        this.bubbleBg.clear();
        this.bubbleBg.fillStyle(0x0d0d20, 0.94);
        this.bubbleBg.fillRoundedRect(cx - bW / 2, BUBBLE_TOP_Y, bW, BUBBLE_H, r);
        this.bubbleBg.lineStyle(1.5, borderColor, 0.9);
        this.bubbleBg.strokeRoundedRect(cx - bW / 2, BUBBLE_TOP_Y, bW, BUBBLE_H, r);
        const tailX = cx - bW / 2 + 280;
        const tailY = BUBBLE_TOP_Y + BUBBLE_H;
        this.bubbleBg.fillStyle(0x0d0d20, 0.94);
        this.bubbleBg.fillTriangle(tailX, tailY - 1, tailX + 49, tailY - 1, tailX, tailY + 45);
        this.tweens.add({
            targets: [this.bubbleBg, this.bubbleNameBg, this.bubbleNameText],
            alpha: 1, duration: 350, ease: 'Quad.easeOut',
        });
    }

    private positionDiv(): void {
        if (!this.bubbleTextDiv) return;
        const w   = this.scale.width;
        const bW  = w * 0.42;
        const cx  = w * 0.76;
        const pad = 12;
        const rect = this.scale.canvas.getBoundingClientRect();
        const sx = rect.width  / this.scale.width;
        const sy = rect.height / this.scale.height;
        this.bubbleTextDiv.style.left   = (rect.left + (cx - bW / 2 + pad) * sx) + 'px';
        this.bubbleTextDiv.style.top    = (rect.top  + (BUBBLE_TOP_Y + pad) * sy) + 'px';
        this.bubbleTextDiv.style.width  = (bW - pad * 2) * sx + 'px';
        this.bubbleTextDiv.style.height = (BUBBLE_H - pad * 2) * sy + 'px';
    }

    private showThinking(): void {
        if (!this.bubbleTextDiv) return;
        this.drawBubble(false);
        this.positionDiv();
        this.bubbleTextDiv.innerHTML = `
            <div style="color:#aaaacc;font-size:11px;margin-bottom:14px;letter-spacing:1px;">
                Кошечка Рекурсия просыпается (подожди ~минутку)...
            </div>
            <div>
                <span class="thinking-dot"></span>
                <span class="thinking-dot"></span>
                <span class="thinking-dot"></span>
            </div>`;
        this.bubbleTextDiv.style.display = 'block';
    }

    private setChatLocked(locked: boolean): void {
        if (this.chatInput) this.chatInput.disabled = locked;
        if (this.chatBtn)   this.chatBtn.disabled   = locked;
        if (this.chatBtn)   this.chatBtn.style.opacity = locked ? '0.5' : '1';
    }

    private async greetAsync(): Promise<void> {
        this.showThinking();
        const response = await aiAgent.greetPlayer();
        this.showSpeechBubble(response.text, false);
    }

    private createChatWidget(): void {
        const widget = document.createElement('div');
        widget.id = 'cat-chat-widget';
        widget.style.cssText = [
            'position:fixed',
            'bottom:56px',
            'left:calc(65vw * 0.53)',
            'width:calc(65vw * 0.44)',
            'z-index:200',
            'display:flex',
            'flex-direction:column',
            'gap:4px',
            'box-shadow:0 2px 12px rgba(0,0,0,0.5)',
        ].join(';');

        const inputRow = document.createElement('div');
        inputRow.style.cssText = 'display:flex;gap:0;';
        widget.appendChild(inputRow);

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Спроси у кошечки Рекурсии...';
        input.style.cssText = [
            'flex:2',
            'background:#0d0d20',
            'color:#e0e0ff',
            'border:1px solid #334455',
            'font-family:monospace',
            'font-size:14px',
            'padding:10px 14px',
            'outline:none',
            'border-radius:8px 0 0 8px',
            'min-width:0',
        ].join(';');

        const btn = document.createElement('button');
        btn.textContent = '→';
        btn.style.cssText = [
            'background:#2244aa',
            'color:#ffffff',
            'border:1px solid #334455',
            'border-left:none',
            'font-family:monospace',
            'font-size:18px',
            'padding:10px 18px',
            'cursor:pointer',
            'border-radius:0 8px 8px 0',
            'flex-shrink:0',
        ].join(';');
        btn.addEventListener('mouseenter', () => { btn.style.background = '#3366cc'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#2244aa'; });

        const send = async () => {
            const q = input.value.trim();
            if (!q) return;
            input.value = '';
            this.setChatLocked(true);
            this.showThinking();
            const response = await aiAgent.ask(q);
            this.showSpeechBubble(response.text, false);
            this.setChatLocked(false);
        };

        btn.addEventListener('click', send);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

        inputRow.appendChild(input);
        inputRow.appendChild(btn);
        document.body.appendChild(widget);
        this.chatWidget  = widget;
        this.chatInput   = input;
        this.chatBtn     = btn;
    }

    private drawLabels(w: number, h: number) {
        const taskOffset = 25;
        const taskY = h * 0.10 + taskOffset;
        
        const taskBg = this.add.graphics();
        taskBg.fillStyle(0x0d0a1a, 0.95);
        taskBg.fillRoundedRect(w * 0.25 - 200, taskY - 70, 400, 130, 8);
        taskBg.lineStyle(3, 0xffaa66, 0.6);
        taskBg.strokeRoundedRect(w * 0.25 - 200, taskY - 70, 400, 130, 8);
        
        const cornerSize = 12;
        const rectX = w * 0.25 - 200;
        const rectY = taskY - 70;
        const rectW = 400;
        const rectH = 130;
        
        const corners = this.add.graphics();
        corners.lineStyle(2, 0xffaa66, 0.8);
        corners.lineBetween(rectX, rectY + cornerSize, rectX, rectY);
        corners.lineBetween(rectX, rectY, rectX + cornerSize, rectY);
        corners.lineBetween(rectX + rectW - cornerSize, rectY, rectX + rectW, rectY);
        corners.lineBetween(rectX + rectW, rectY, rectX + rectW, rectY + cornerSize);
        corners.lineBetween(rectX, rectY + rectH - cornerSize, rectX, rectY + rectH);
        corners.lineBetween(rectX, rectY + rectH, rectX + cornerSize, rectY + rectH);
        corners.lineBetween(rectX + rectW - cornerSize, rectY + rectH, rectX + rectW, rectY + rectH);
        corners.lineBetween(rectX + rectW, rectY + rectH - cornerSize, rectX + rectW, rectY + rectH);
        
        this.add.text(w * 0.25, taskY - 60, '▸ ЗАДАНИЕ ◂', {
            fontSize: '22px',
            fontFamily: 'pixel',
            color: '#ffaa66',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0);
        
        this.add.text(w * 0.25, taskY - 35, 'Собери стек так, чтобы', {
            fontSize: '18px',
            fontFamily: 'pixel',
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5, 0);
        
        this.add.text(w * 0.25, taskY - 10, 'ВАЖНАЯ КНИГА БЫЛА СНИЗУ (LIFO)\n Ширина = Важность', {
            fontSize: '20px',
            fontFamily: 'pixel',
            color: '#ff8866',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0);
        
    }

    private sourcePositions() {
        const w = this.scale.width;
        const h = this.scale.height;
        const left = w * 0.1;

        return [
            { x: left, y: h * 0.44 },
            { x: left + w * 0.12, y: h * 0.36 },
            { x: left, y: h * 0.64 },
            { x: left + w * 0.12, y: h * 0.60 },
        ];
    }

    private spawnSourceBooks() {
        const positions = this.sourcePositions();
        const initialStack = ['Идиот', 'Дикий Веперь'];
        let srcPosIndex = 0;

        SOURCE_BOOKS.forEach((data) => {
            const customSize = BOOK_CUSTOM_SIZES[data.name];
            
            if (initialStack.includes(data.name)) {
                const stackIdx = initialStack.indexOf(data.name);
                const book = new Book(
                    this, 0, 0, data.name, data.significance, data.colorIndex,
                    customSize?.width, customSize?.height
                );
               
                book.setPosition(this.bookX(book.bookW), this.bookY(stackIdx, book.bookH));
                this.destStack[stackIdx] = book;
            } else {
                const { x, y } = positions[srcPosIndex++] || positions[0];
                const book = new Book(
                    this, x, y + 28, data.name, data.significance, data.colorIndex,
                    customSize?.width, customSize?.height
                );
                book.setAlpha(0);
                this.tweens.add({
                    targets: book, alpha: 1, y,
                    duration: 20, delay: srcPosIndex * 80, ease: 'Quad.easeOut',
                });
                this.sourceBooks.set(data.name, book);
                this.makeBookInteractive(book, y);
            }
        });
        this.updateStackDepths();
    }

    private updateStackDepths(): void {
        const baseDepth = 200;
        for (let i = 0; i < this.destStack.length; i++) {
            const b = this.destStack[i];
            if (!b) continue;
            b.setDepth(baseDepth + i);
        }
        for (const b of this.sourceBooks.values()) {
            try { b.setDepth(baseDepth - 50); } catch (e) { /* ignore */ }
        }
    }

    private makeBookInteractive(book: Book, baseY: number) {
        try {
            book.setInteractive();
            book.on('pointerover', () =>
                this.tweens.add({ targets: book, y: baseY - 12, duration: 150, ease: 'Quad.easeOut' })
            );
            book.on('pointerout', () =>
                this.tweens.add({ targets: book, y: baseY, duration: 150, ease: 'Quad.easeIn' })
            );
        } catch (e) {
            // Some objects may not support interactivity at creation time — ignore safely
        }
    }

    async collectAllToStack(): Promise<void> {
        for (const name of TARGET_ORDER) {
            const book = this.sourceBooks.get(name);
            if (!book) continue;
            this.sourceBooks.delete(name);
            const idx = this.destStack.length;
            await book.moveToAsync(this.bookX(book.bookW), this.bookY(idx, book.bookH), 430);
            this.destStack.push(book);
            this.updateStackDepths();
        }
        this.updateStackDepths();
    }

    private tableY(h: number)      { return h * 0.93; }
    private stackBaseY()           { return this.tableY(this.scale.height); }
    private stackCenterX()         { return this.scale.width * 0.66 - 250; }
    private bookX(bookW: number)   { return this.stackCenterX() - bookW / 2; }
    
    private bookY(index: number, bookHeight?: number): number {
        const height = bookHeight ?? DEFAULT_BOOK_H;
        let totalOffset = 0;
        
        // Суммируем высоты всех предыдущих книг в стеке
        for (let i = 0; i < index && i < this.destStack.length; i++) {
            const prevBook = this.destStack[i];
            const prevHeight = prevBook?.bookH ?? DEFAULT_BOOK_H;
            totalOffset += prevHeight + STACK_GAP;
        }
        
        // Если индекс выходит за пределы текущего стека, используем накопленную сумму
        if (index >= this.destStack.length) {
            for (let i = this.destStack.length; i < index; i++) {
                totalOffset += DEFAULT_BOOK_H + STACK_GAP;
            }
        }
        
        return this.stackBaseY() - height - totalOffset;
    }

    private async doPush(bookName: string): Promise<void> {
        const book = this.sourceBooks.get(bookName);
        if (!book) {
            window.showOutput(`❌ Книга "${bookName}" не найдена в источнике`, true);
            return;
        }
        this.sourceBooks.delete(bookName);
        const idx = this.destStack.length;
        const yPos = this.bookY(idx, book.bookH);
        await book.moveToAsync(this.bookX(book.bookW), yPos, 430);
        this.destStack.push(book);
        this.updateStackDepths();
    }

    private async doPop(): Promise<void> {
        if (this.destStack.length === 0) {
            window.showOutput('❌ Стек пуст — нечего убирать (POP)', true);
            return;
        }
        const book = this.destStack.pop()!;

        const positions = this.sourcePositions();
        const nextIndex = Math.min(this.sourceBooks.size, positions.length - 1);
        const pos = positions[nextIndex] || positions[0];

        await book.moveToAsync(pos.x, pos.y, 380);
        book.setAlpha(1);
        this.sourceBooks.set(book.bookName, book);
        this.makeBookInteractive(book, pos.y);
        try { book.setDepth(150); } catch (e) { /* ignore */ }
    }

    private async runCommands(commands: any[]): Promise<void> {
        for (const cmd of commands) {
            if      (cmd.type === 'PUSH' && cmd.bookName) await this.doPush(cmd.bookName);
            else if (cmd.type === 'POP')                  await this.doPop();
        }
    }

    private checkVictory(): boolean {
        return (
            this.destStack.length === TARGET_ORDER.length &&
            this.destStack.every((b, i) => b.bookName === TARGET_ORDER[i])
        );
    }

    private showVictory(aiText: string) {
        SaveManager.markLevelComplete('stack');

        this.levelComplete = true;
        this.victoryAiText = aiText;
        window.setExecuteButtonState(true, '✓ Задание выполнено — молодец!');

        const canvas = this.scale.canvas;
        const rect   = canvas.getBoundingClientRect();
        const sx     = rect.width  / this.scale.width;
        const sy     = rect.height / this.scale.height;
        const w      = this.scale.width;
        const bW     = w * 0.42;
        const cx     = w * 0.76;

        const btn = document.createElement('button');
        btn.textContent = '← Вернуться в хаб';
        btn.style.cssText = [
            'position:fixed',
            `left:${rect.left + (cx + bW / 2 - 190) * sx}px`,
            `top:${rect.top + (BUBBLE_TOP_Y + BUBBLE_H + 10) * sy}px`,
            'background:#2244aa',
            'color:#ffffff',
            'border:none',
            'font-family:monospace',
            'font-size:14px',
            'padding:7px 16px',
            'cursor:pointer',
            'border-radius:4px',
            'z-index:201',
        ].join(';');
        btn.addEventListener('mouseenter', () => { btn.style.background = '#3366cc'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#2244aa'; });
        btn.addEventListener('click', () => {
            this.cleanup();
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HubScene'));
        });
        document.body.appendChild(btn);
        this.hubButton = btn;
    }

    private resetForNewRun() {
        for (const b of this.sourceBooks.values()) b.destroy();
        for (const b of this.destStack) b.destroy();
        this.sourceBooks.clear();
        this.destStack = [];
        this.spawnSourceBooks();
    }

    private async handleExecutionResult(result: any): Promise<void> {
        if (this.executing) return;

        const code = this.editor?.getCode() ?? '';

        if (!result.success) {
            this.showThinking();
            const fb = await aiAgent.getHint(code, result.error, false);
            this.showSpeechBubble(fb.text, true);
            return;
        }

        const cmds = (result.commands ?? []).filter(
            (c: any) => c.type === 'PUSH' || c.type === 'POP',
        );
        if (cmds.length === 0) {
            this.showThinking();
            const fb = await aiAgent.getHint(code, 'Нет команд PUSH/POP в выводе программы', false);
            this.showSpeechBubble(fb.text, true);
            return;
        }

        if (this.editor) SaveManager.saveCode('stack', this.editor.getCode());

        this.executing = true;
        this.hideSpeechBubble();
        this.resetForNewRun();

        await new Promise<void>(r => setTimeout(r, 420));

        await this.runCommands(cmds);

        this.showThinking();
        const success = this.checkVictory();
        const cmdNames = cmds.map((c: any) =>
            c.type === 'PUSH' ? `PUSH(${c.bookName})` : 'POP'
        );
        const fb = await aiAgent.getCodeFeedback(code, cmdNames, TARGET_ORDER, success);
        if (success) this.showVictory(fb.text);
        this.showSpeechBubble(fb.text, !success);

        this.executing = false;
    }

    private createBackButton() {
        const btn = this.add.text(14, 14, '← Хаб', {
            fontSize: '13px', color: '#888899',
        }).setInteractive({ useHandCursor: true });

        btn.on('pointerover',  () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerout',   () => btn.setStyle({ color: '#888899' }));
        btn.on('pointerdown', () => {
            this.cleanup();
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HubScene'));
        });
    }

    completeLevel() { SaveManager.markLevelComplete('stack'); }

    private cleanup() {
        if (this.editor) {
            SaveManager.saveCode('stack', this.editor.getCode());
            this.editor.cleanup();
            this.editor = null;
        }
        if (this.bubbleTextDiv) {
            this.bubbleTextDiv.remove();
            this.bubbleTextDiv = null;
        }
        if (this.hubButton) {
            this.hubButton.remove();
            this.hubButton = null;
        }
        if (this.chatWidget) {
            this.chatWidget.remove();
            this.chatWidget = null;
        }
        window.showExecuteButton(false);
    }
}