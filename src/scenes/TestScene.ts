import Phaser from 'phaser';
import { CodeEditor } from '../ui/CodeEditor';

function drawBook(
    scene: Phaser.Scene,
    x: number,
    y: number,
    title: string,
    color: number = 0x8b4513
): Phaser.GameObjects.Container {
    const BOOK_W = 60;
    const BOOK_H = 80;

    const spine = scene.add.graphics();
    spine.fillStyle(color, 1);
    spine.fillRect(0, 0, BOOK_W, BOOK_H);
    spine.fillStyle(0xffffff, 0.15);
    spine.fillRect(0, 0, 8, BOOK_H);
    spine.fillStyle(0x000000, 0.2);
    spine.fillRect(0, BOOK_H - 6, BOOK_W, 6);

    const label = scene.add.text(BOOK_W / 2, BOOK_H / 2, title, {
        fontSize: '10px',
        color: '#ffffff',
        wordWrap: { width: BOOK_W - 8 },
        align: 'center',
    }).setOrigin(0.5);

    const container = scene.add.container(x, y, [spine, label]);
    container.setSize(BOOK_W, BOOK_H);
    return container;
}

export class TestScene extends Phaser.Scene {
    private editor: CodeEditor | null = null;

    constructor() {
        super({ key: 'TestScene' });
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

        // Книги (статичные)
        const stackX = width / 2 - 30;
        const stackBaseY = 450;
        const STACK_OFFSET = 16;

        const stackBooks = [
            { title: 'Война и мир', color: 0x8b4513 },
            { title: 'Мастер и\nМаргарита', color: 0x2e4a7a },
            { title: 'Преступление', color: 0x4a7a2e },
        ];

        stackBooks.forEach((book, i) => {
            const y = stackBaseY - i * STACK_OFFSET;
            const c = drawBook(this, stackX, y, book.title, book.color);
            c.setInteractive();
            c.on('pointerover', () =>
                this.tweens.add({ targets: c, y: y - 12, duration: 150, ease: 'Quad.easeOut' })
            );
            c.on('pointerout', () =>
                this.tweens.add({ targets: c, y, duration: 150, ease: 'Quad.easeIn' })
            );
        });

        this.add.text(stackX + 30, stackBaseY + 100, 'Стопка книг', {
            fontSize: '12px', color: '#666688',
        }).setOrigin(0.5, 0);

        const soloBooks = [
            { title: 'Идиот', color: 0x7a3a6e },
            { title: 'Мёртвые\nдуши', color: 0x3a6e7a },
            { title: '1984', color: 0x6e6e3a },
        ];

        const soloX = stackX + 120;
        const soloBaseY = stackBaseY + (stackBooks.length - 2) * STACK_OFFSET;

        soloBooks.forEach((book, i) => {
            const x = soloX + i * 80;
            const c = drawBook(this, x, soloBaseY, book.title, book.color);
            c.setInteractive();
            c.on('pointerover', () =>
                this.tweens.add({ targets: c, y: soloBaseY - 12, duration: 150, ease: 'Quad.easeOut' })
            );
            c.on('pointerout', () =>
                this.tweens.add({ targets: c, y: soloBaseY, duration: 150, ease: 'Quad.easeIn' })
            );
        });

        this.add.text(soloX + 80, stackBaseY + 100, 'Отдельные книги', {
            fontSize: '12px', color: '#666688',
        }).setOrigin(0.5, 0);

        this.add.text(width / 2, 30, 'Тестовая сцена с редактором C++', {
            fontSize: '18px', color: '#aaaacc',
        }).setOrigin(0.5, 0);

        const back = this.add.text(16, 16, '← Хаб', {
            fontSize: '13px', color: '#888899',
        }).setInteractive({ useHandCursor: true });

        back.on('pointerover', () => back.setStyle({ color: '#ffffff' }));
        back.on('pointerout', () => back.setStyle({ color: '#888899' }));
        back.on('pointerdown', () => {
            this.cleanup();
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('HubScene');
            });
        });
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