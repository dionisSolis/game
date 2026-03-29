import Phaser from 'phaser';
import { Book } from '../objects/Book';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { SaveManager } from '../utils/SaveManager';
import { CodeEditor } from '../ui/CodeEditor';

const DIVIDER_X = GAME_WIDTH / 2;

const BOOK_W = 60;
const BOOK_H = 80;

const STACK_X      = DIVIDER_X / 2 - BOOK_W / 2;
const STACK_BASE_Y = GAME_HEIGHT - 130;
const STACK_STEP   = 22;

const TEMP_X      = 30;
const TEMP_BASE_Y = STACK_BASE_Y;

export class LevelStackScene extends Phaser.Scene {
    private stack:    Book[] = [];
    private tempZone: Book[] = [];
    private editor: CodeEditor | null = null;

    constructor() {
        super({ key: 'LevelStackScene' });
    }

    create() {
        window.setGameHalfWidth();
                
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
        
        // Создаем редактор кода
        this.editor = new CodeEditor('game-container');
        window.showExecuteButton(true);
        
        // Регистрируем обработчик результата выполнения кода (уведомления в main.ts)
        this.editor.onExecute((result) => {
            this.handleExecutionResult(result);
        });
        
        this.stack    = [];
        this.tempZone = [];

        this.drawBackground();
        this.drawTable();
        this.createBackButton();

        ['1984', 'Идиот', 'Мастер и\nМаргарита', 'Война\nи мир'].forEach(name =>
            this.pushBook(name)
        );

        this.spawnSoloBooks();
    }

    // API стека
    pushBook(bookName: string) {
        const index   = this.stack.length;
        const targetY = STACK_BASE_Y - BOOK_H - index * STACK_STEP;

        const book = new Book(this, STACK_X, targetY - 100, bookName, index);
        book.setAlpha(0);

        this.tweens.add({
            targets:  book,
            y:        targetY,
            alpha:    1,
            duration: 380,
            ease:     'Bounce.easeOut',
        });

        this.stack.push(book);
    }

    popBook() {
        if (this.stack.length === 0) return;

        const book      = this.stack.pop()!;
        const tempIndex = this.tempZone.length;
        const targetY   = TEMP_BASE_Y - BOOK_H - tempIndex * STACK_STEP;

        book.moveTo(TEMP_X, targetY, 450);
        this.tempZone.push(book);
    }

    private drawBackground() {
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-level');
    }

    private drawTable() {
        const tbl = this.add.graphics();
        tbl.fillStyle(0x5c3d1e, 1);
        tbl.fillRect(10, STACK_BASE_Y, GAME_WIDTH - 20, 14);
        tbl.fillStyle(0x000000, 0.25);
        tbl.fillRect(10, STACK_BASE_Y + 14, GAME_WIDTH - 20, 5);

        this.add.text(STACK_X + BOOK_W / 2, STACK_BASE_Y + 22, 'Стопка', {
            fontSize: '11px', color: '#a08060',
        }).setOrigin(0.5, 0);

        const box = this.add.graphics();
        box.lineStyle(1, 0x666644, 0.45);
        box.strokeRect(TEMP_X - 4, STACK_BASE_Y - BOOK_H * 5, BOOK_W + 8, BOOK_H * 5);

        this.add.text(TEMP_X + BOOK_W / 2, STACK_BASE_Y + 22, 'Временно (стэк)', {
            fontSize: '11px', color: '#a08060',
        }).setOrigin(0.5, 0);
    }

    private spawnSoloBooks() {
        const soloData = [
            { name: 'Преступление\nи наказание', color: 4 },
            { name: 'Мёртвые\nдуши',             color: 5 },
            { name: 'Евгений\nОнегин',           color: 2 },
        ];

        const startX = STACK_X + BOOK_W + 80;
        const y      = STACK_BASE_Y - BOOK_H;

        soloData.forEach((data, i) => {
            const x    = startX + i * (BOOK_W + 20);
            const book = new Book(this, x, y + 40, data.name, data.color);
            book.setAlpha(0);

            this.tweens.add({
                targets:  book,
                y,
                alpha:    1,
                duration: 300,
                delay:    i * 100,
                ease:     'Quad.easeOut',
            });

            book.setInteractive();
            book.on('pointerover', () =>
                this.tweens.add({ targets: book, y: y - 12, duration: 120, ease: 'Quad.easeOut' })
            );
            book.on('pointerout', () =>
                this.tweens.add({ targets: book, y, duration: 120, ease: 'Quad.easeIn' })
            );
        });

        this.add.text(startX + (soloData.length * (BOOK_W + 20)) / 2 - 10, STACK_BASE_Y + 22, 'Книги', {
            fontSize: '11px', color: '#a08060',
        }).setOrigin(0.5, 0);
    }

    private createBackButton() {
        const btn = this.add.text(14, 14, '← Хаб', {
            fontSize: '13px', color: '#888899',
        }).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerout',  () => btn.setStyle({ color: '#888899' }));
        btn.on('pointerdown', () => {
            this.cleanup();
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () =>
                this.scene.start('HubScene')
            );
        });
    }

    // TODO: вызвать когда игрок правильно отсортирует стопку
    // Как только появится условие победы, сделаем вызов this.completeLevel().
    completeLevel() {
        SaveManager.markLevelComplete('stack');
    }
    
    private handleExecutionResult(result: any): void {
        // Формируем текст уведомления
        let message = '';
        let isError = false;

        if (!result.success) {
            message = `❌ Ошибка: ${result.error || 'Неизвестная ошибка'}`;
            isError = true;
        } else {
            const validCommands = result.commands?.filter((cmd: any) => cmd.type !== 'UNKNOWN') || [];
            
            if (validCommands.length > 0) {
                message = '✅ Полученные команды:\n';
                validCommands.forEach((cmd: any, i: number) => {
                    if (cmd.type === 'PUSH' && cmd.bookName) {
                        message += `\n${i + 1}. PUSH: ${cmd.bookName}`;
                    } else if (cmd.type === 'POP') {
                        message += `\n${i + 1}. POP`;
                    } else {
                        message += `\n${i + 1}. ${cmd.type}`;
                    }
                });
            } else if (result.rawOutput && result.rawOutput.trim()) {
                message = `✅ Вывод программы:\n${result.rawOutput}`;
            } else {
                message = '✅ Код выполнен успешно!';
            }
        }

        // Показываем уведомление через глобальную функцию (над кнопкой)
        window.showOutput(message, isError);
    }

    private cleanup(): void {
        if (this.editor) {
            this.editor.cleanup();
            this.editor = null;
        }
        window.showExecuteButton(false);
    }
}
