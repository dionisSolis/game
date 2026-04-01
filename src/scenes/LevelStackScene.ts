import Phaser from 'phaser';
import { Book, BOOK_H } from '../objects/Book';
import { SaveManager } from '../utils/SaveManager';
import { CodeEditor } from '../ui/CodeEditor';


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

    constructor() { super({ key: 'LevelStackScene' }); }


    create() {
        window.setGameHalfWidth();

        const w = this.scale.width;
        const h = this.scale.height;

        this.add.rectangle(w / 2, h / 2, w, h, 0x1a1a2e);

        try {
            this.add.image(w / 2, h / 2, 'bg-level').setDisplaySize(w, h);
        } catch { }

        this.drawDivider(w, h);
        this.drawTable(w, h);
        this.drawLabels(w, h);
        this.drawTargetHint(w, h);
        this.spawnSourceBooks();
        this.createBackButton();

        this.editor = new CodeEditor('game-container');
        window.showExecuteButton(true);
        this.editor.onExecute(r => this.handleExecutionResult(r));

        const savedCode = SaveManager.loadCode('stack');
        if (savedCode) this.editor.setCode(savedCode);
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
        this.add.text(w * 0.25, 24, 'Источник', {
            fontSize: '1.4em', color: '#a08060',
        }).setOrigin(0.5);

        this.add.text(w * 0.66, 24, 'Стек (LIFO)', {
            fontSize: '1.4em', color: '#a08060',
        }).setOrigin(0.5);

        this.add.text(w * 0.25, 46, 'Ширина книги = её важность', {
            fontSize: '1.4em', color: '#5a5a44',
        }).setOrigin(0.5);

        this.add.text(w * 0.25, h * 0.10, 'Задача: собери стек так,\nчтобы важная книга\nлежала снизу', {
            fontSize: '2em', color: '#7a7a99', align: 'center',
        }).setOrigin(0.5, 0);
    }

    /** Ghost outlines showing the desired final stack state */
    private drawTargetHint(w: number, h: number) {
        const cx = w * 0.88;

        TARGET_ORDER.forEach((name, i) => {
            const data = SOURCE_BOOKS.find(b => b.name === name)!;
            const bW   = 84 - (data.significance - 1) * 14;
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
        return [
            { x: w * 0.10, y: h * 0.44 },
            { x: w * 0.33, y: h * 0.36 },
            { x: w * 0.09, y: h * 0.64 },
            { x: w * 0.32, y: h * 0.60 },
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
                duration: 300, delay: i * 80, ease: 'Quad.easeOut',
            });
            this.sourceBooks.set(data.name, book);
        });
    }


    private tableY(h: number)      { return h * 0.86; }
    private stackBaseY()           { return this.tableY(this.scale.height); }
    private stackCenterX()         { return this.scale.width * 0.66; }
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
        const w = this.scale.width;
        const h = this.scale.height;

        this.add.rectangle(w * 0.48, h * 0.48, w * 0.58, h * 0.40, 0x000000, 0.90).setDepth(10);

        this.add.text(w * 0.48, h * 0.36, '✓ Стек собран!', {
            fontSize: '24px', color: '#44ff88',
        }).setOrigin(0.5).setDepth(11);


        this.add.text(w * 0.48, h * 0.65, '← Вернуться в хаб', {
            fontSize: '13px', color: '#88aaff',
        }).setOrigin(0.5).setDepth(11)
            .setInteractive({ useHandCursor: true })
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
            window.showOutput(`❌ ${result.error || 'Ошибка'}`, true);
            return;
        }

        const cmds = (result.commands ?? []).filter(
            (c: any) => c.type === 'PUSH' || c.type === 'POP',
        );
        if (cmds.length === 0) {
            window.showOutput('❌ Нет команд PUSH/POP в выводе программы', true);
            return;
        }

        if (this.editor) SaveManager.saveCode('stack', this.editor.getCode());

        this.executing = true;
        this.resetForNewRun();

        await new Promise<void>(r => setTimeout(r, 420));

        await this.runCommands(cmds);

        if (this.checkVictory()) this.showVictory();

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
