import Phaser from 'phaser';
import { Book, BOOK_H } from '../objects/Book';
import { SaveManager } from '../utils/SaveManager';
import { CodeEditor } from '../ui/CodeEditor';
import { getStackLevelFeedback } from '../feedback/recurs';


const SOURCE_BOOKS = [
    { name: '1984',        significance: 3, colorIndex: 2 },
    { name: 'Дикий Веперь', significance: 1, colorIndex: 0 },
    { name: 'Стихи',       significance: 4, colorIndex: 3 },
    { name: 'Идиот',       significance: 2, colorIndex: 1 },
];

const TARGET_ORDER = ['Дикий Веперь', 'Идиот', '1984', 'Стихи'];

const STACK_GAP = 3;


export class LevelStackScene extends Phaser.Scene {
    private sourceBooks: Map<string, Book> = new Map();
    private destStack:   Book[]            = [];
    private editor:      CodeEditor | null = null;
    private executing    = false;

    private bubbleBg:   Phaser.GameObjects.Graphics | null = null;
    private bubbleText: Phaser.GameObjects.Text    | null = null;
    private bubbleLastH = 0;

    constructor() { super({ key: 'LevelStackScene' }); }


    create() {
        window.setGameHalfWidth();

        const w = this.scale.width;
        const h = this.scale.height;

        this.add.rectangle(w / 2, h / 2, w, h, 0x1a1a2e);

        try {
            this.add.image(w / 2, h / 2, 'bg-level').setDisplaySize(w, h);
        } catch { }

        this.drawTable(w, h);
        this.drawLabels(w, h);
        this.drawTargetHint(w, h);
        this.spawnSourceBooks();
        this.createBackButton();

        this.createSpeechBubble(w, h);

        this.editor = new CodeEditor('game-container');
        window.showExecuteButton(true);
        this.editor.onExecute(r => this.handleExecutionResult(r));

        const savedCode = SaveManager.loadCode('stack');
        if (savedCode) this.editor.setCode(savedCode);
    }


    private createSpeechBubble(w: number, h: number): void {
        const bW  = w * 0.42;
        const cx  = w * 0.72;
        const pad = 30;

        this.bubbleBg = this.add.graphics().setDepth(8).setAlpha(0);

        this.bubbleText = this.add.text(
            cx - bW / 2 + pad,
            68 + pad,
            '',
            {
                fontSize: '20px',
                fontFamily: '"Press Start 2P", monospace',
                color: '#e0e0ff',
                wordWrap: { width: bW - pad * 2 },
                lineSpacing: 6,
            },
        ).setOrigin(0, 0).setDepth(9).setAlpha(0);
    }

    private showSpeechBubble(message: string, isError: boolean): void {
        if (!this.bubbleBg || !this.bubbleText) return;

        const w   = this.scale.width;
        const bW  = w * 0.42;
        const cx  = w * 0.76;
        const pad = 12;
        const r   = 10;
        const topY = 300;

        this.bubbleText.setText(message);
        const bH    = Math.max(140, this.bubbleText.height + pad * 2);
        this.bubbleLastH = bH;
        const tailX = cx - bW / 2 + 280;
        const tailY = topY + bH;

        const borderColor = isError ? 0xaa3333 : 0x33aa77;

        this.bubbleBg.clear();
        this.bubbleBg.fillStyle(0x0d0d20, 0.94);
        this.bubbleBg.fillRoundedRect(cx - bW / 2, topY, bW, bH, r);
        this.bubbleBg.lineStyle(1.5, borderColor, 0.9);
        this.bubbleBg.strokeRoundedRect(cx - bW / 2, topY, bW, bH, r);
        this.bubbleBg.fillStyle(0x0d0d20, 0.94);
        this.bubbleBg.fillTriangle(tailX, tailY - 1, tailX + 49, tailY - 1, tailX, tailY + 45);

        this.bubbleText.setPosition(cx - bW / 2 + pad, topY + pad);

        this.tweens.add({
            targets: [this.bubbleBg, this.bubbleText],
            alpha: 1,
            duration: 350,
            ease: 'Quad.easeOut',
        });
    }

    private hideSpeechBubble(): void {
        if (this.bubbleBg)   this.bubbleBg.setAlpha(0);
        if (this.bubbleText) this.bubbleText.setAlpha(0);
    }

    private drawDivider(w: number, h: number) {
        const g = this.add.graphics();
        g.lineStyle(1, 0x444466, 0.35);
        g.lineBetween(w * 0.5, 30, w * 0.5, h - 20);
    }

    private drawTable(w: number, h: number) {
        const tableY = this.tableY(h);
        const g = this.add.graphics();
        g.fillStyle(0x5c3d1e, 1);
        g.fillRect(10, tableY, w - 20, 14);
        g.fillStyle(0x000000, 0.25);
        g.fillRect(10, tableY + 14, w - 20, 5);
    }

private drawLabels(w: number, h: number) {
    const pixelFont = '"Press Start 2P", monospace';
    const monoFont = '"Courier New", monospace';
    
    const sourceBg = this.add.graphics();
    sourceBg.fillStyle(0x2a1a0a, 0.9);
    sourceBg.fillRoundedRect(w * 0.25 - 120, 12, 240, 48, 4);
    sourceBg.lineStyle(2, 0xc4a27a, 0.8);
    sourceBg.strokeRoundedRect(w * 0.25 - 120, 12, 240, 48, 4);
    
    this.add.text(w * 0.25, 36, 'ИСТОЧНИК', {
        fontSize: '22px',
        fontFamily: pixelFont,
        color: '#ffcc88',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const stackBg = this.add.graphics();
    stackBg.fillStyle(0x2a1a0a, 0.9);
    stackBg.fillRoundedRect(w * 0.66 - 140, 12, 280, 48, 4);
    stackBg.lineStyle(2, 0xc4a27a, 0.8);
    stackBg.strokeRoundedRect(w * 0.66 - 140, 12, 280, 48, 4);
    
    this.add.text(w * 0.66, 36, 'СТЕК (LIFO)', {
        fontSize: '22px',
        fontFamily: pixelFont,
        color: '#ffcc88',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const hintBg = this.add.graphics();
    hintBg.fillStyle(0x1a1a0a, 0.7);
    hintBg.fillRoundedRect(w * 0.25 - 160, 70, 320, 32, 3);
    hintBg.lineStyle(1, 0x8a8a66, 0.5);
    hintBg.strokeRoundedRect(w * 0.25 - 160, 70, 320, 32, 3);
    
    this.add.text(w * 0.25, 86, 'Ширина книги = важность', {
        fontSize: '14px',
        fontFamily: monoFont,
        color: '#a8a888',
    }).setOrigin(0.5);

    const taskOffset = 25;
    const taskY = h * 0.10 + taskOffset;
    
    const taskBg = this.add.graphics();
    taskBg.fillStyle(0x0d0a1a, 0.95);
    taskBg.fillRoundedRect(w * 0.25 - 200, taskY - 10, 400, 130, 8);
    taskBg.lineStyle(3, 0xffaa66, 0.6);
    taskBg.strokeRoundedRect(w * 0.25 - 200, taskY - 10, 400, 130, 8);
    
    const cornerSize = 12;
    const rectX = w * 0.25 - 200;
    const rectY = taskY - 10;
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
    
    this.add.text(w * 0.25, taskY + 15, '▸ ЗАДАНИЕ ◂', {
        fontSize: '18px',
        fontFamily: pixelFont,
        color: '#ffaa66',
        fontStyle: 'bold',
        align: 'center'
    }).setOrigin(0.5, 0);
    
    this.add.text(w * 0.25, taskY + 50, 'Собери стек так, чтобы', {
        fontSize: '18px',
        fontFamily: monoFont,
        color: '#dddddd',
        align: 'center'
    }).setOrigin(0.5, 0);
    
    this.add.text(w * 0.25, taskY + 82, 'ВАЖНАЯ КНИГА БЫЛА СНИЗУ', {
        fontSize: '20px',
        fontFamily: pixelFont,
        color: '#ff8866',
        fontStyle: 'bold',
        align: 'center'
    }).setOrigin(0.5, 0);
    
    this.add.graphics().fillStyle(0xffaa66, 0.7);
    const arrow = this.add.graphics();
    arrow.fillStyle(0xffaa66, 0.7);
    arrow.fillTriangle(w * 0.48, taskY + 50, w * 0.52, taskY + 10, w * 0.52, taskY + 190);
    
    this.tweens.add({
        targets: arrow,
        alpha: { from: 0.3, to: 0.9 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
}

    /** Ghost outlines showing the desired final stack state */
    private drawTargetHint(w: number, h: number) {
        const cx = w * 0.88;

        TARGET_ORDER.forEach((name, i) => {
            const data = SOURCE_BOOKS.find(b => b.name === name)!;
            const bW   = 108 - (data.significance - 1) * 16;
            const y = h * 0.78 - i * 22;
            const g = this.add.graphics();
            g.lineStyle(1, 0x444488, 0.55);
            g.strokeRect(cx - bW / 2, y - 8, bW, 16);
            this.add.text(cx, y, name.replace('\n', ' '), {
                fontSize: '8px', color: '#555577',
            }).setOrigin(0.5);
        });
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
        SOURCE_BOOKS.forEach((data, i) => {
            const { x, y } = positions[i];
            const book = new Book(this, x, y + 28, data.name, data.significance, data.colorIndex);
            book.setAlpha(0);
            this.tweens.add({
                targets: book, alpha: 1, y,
                duration: 20, delay: i * 80, ease: 'Quad.easeOut',
            });
            this.sourceBooks.set(data.name, book);
        });
    }


    private tableY(h: number)      { return h * 0.86; }
    private stackBaseY()           { return this.tableY(this.scale.height); }
    private stackCenterX()         { return this.scale.width * 0.66 - 250; }
    private bookX(bookW: number)   { return this.stackCenterX() - bookW / 2; }
    private bookY(index: number)   { return this.stackBaseY() - BOOK_H - index * (BOOK_H + STACK_GAP); }


    private async doPush(bookName: string): Promise<void> {
        const book = this.sourceBooks.get(bookName);
        if (!book) {
            window.showOutput(`❌ Книга "${bookName}" не найдена в источнике`, true);
            return;
        }
        this.sourceBooks.delete(bookName);
        const idx = this.destStack.length;
        await book.moveTo(this.bookX(book.bookW), this.bookY(idx), 430);
        this.destStack.push(book);
    }

    private async doPop(): Promise<void> {
        if (this.destStack.length === 0) {
            window.showOutput('❌ Стек пуст — нечего убирать (POP)', true);
            return;
        }
        await this.destStack.pop()!.pop(280);
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

    private showVictory() {
        SaveManager.markLevelComplete('stack');

        const w    = this.scale.width;
        const bW   = w * 0.42;
        const cx   = w * 0.76;
        const topY = 300;
        const pad  = 12;

        const bubbleLeft  = cx - bW / 2;
        const bubbleRight = cx + bW / 2;
        const bubbleBot   = topY + this.bubbleLastH;

        if (this.bubbleText) {
            this.bubbleText.setY(topY + 44);
        }

        this.add.text(bubbleLeft + pad, topY + pad, '✓ Стек собран!', {
            fontSize: '24px',
            fontFamily: '"Courier New", monospace',
            color: '#44ff88',
            fontStyle: 'bold',
        }).setOrigin(0, 0).setDepth(12);

        this.add.text(bubbleRight - pad, bubbleBot - pad, '  ← Хаб  ', {
            fontSize: '16px',
            fontFamily: '"Courier New", monospace',
            color: '#ffffff',
            backgroundColor: '#2244aa',
            padding: { x: 6, y: 4 },
        }).setOrigin(1, 1).setDepth(12)
            .setInteractive({ useHandCursor: true })
            .on('pointerover',  function(this: Phaser.GameObjects.Text) { this.setStyle({ backgroundColor: '#3366cc' }); })
            .on('pointerout',   function(this: Phaser.GameObjects.Text) { this.setStyle({ backgroundColor: '#2244aa' }); })
            .on('pointerdown', () => {
                this.cleanup();
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HubScene'));
            });
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

        if (!result.success) {
            const fb = getStackLevelFeedback(false, result.error);
            this.showSpeechBubble(fb.message, true);
            return;
        }

        const cmds = (result.commands ?? []).filter(
            (c: any) => c.type === 'PUSH' || c.type === 'POP',
        );
        if (cmds.length === 0) {
            const fb = getStackLevelFeedback(false, 'Нет команд PUSH/POP в выводе программы');
            this.showSpeechBubble(fb.message, true);
            return;
        }

        if (this.editor) SaveManager.saveCode('stack', this.editor.getCode());

        this.executing = true;
        this.hideSpeechBubble();
        this.resetForNewRun();

        await new Promise<void>(r => setTimeout(r, 420));

        await this.runCommands(cmds);

        if (this.checkVictory()) {
            const fb = getStackLevelFeedback(true);
            this.showSpeechBubble(fb.message, false);
            this.showVictory();
        }

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
        window.showExecuteButton(false);
    }
}
