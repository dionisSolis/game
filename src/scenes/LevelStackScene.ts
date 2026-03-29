import Phaser from 'phaser';
import { Book } from '../objects/Book';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { SaveManager } from '../utils/SaveManager';

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

    constructor() {
        super({ key: 'LevelStackScene' });
    }

    create() {
        this.stack    = [];
        this.tempZone = [];

        this.drawBackground();
        this.drawTable();
        // this.drawRightPanel(); // подключить позже, если нужно
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

    private drawRightPanel() {
        const dividerX = GAME_WIDTH / 2;
        const px = dividerX + 16;
        const pw = GAME_WIDTH - dividerX - 24;
        const cx = dividerX + pw / 2 + 8;

        this.add.text(cx, 18, 'Редактор кода', {
            fontSize: '15px', color: '#aaaacc',
        }).setOrigin(0.5, 0);

        const edBg = this.add.graphics();
        edBg.fillStyle(0x0d1117, 0.92);
        edBg.fillRoundedRect(px, 44, pw, 360, 6);
        edBg.lineStyle(1, 0x30304a);
        edBg.strokeRoundedRect(px, 44, pw, 360, 6);

        this.add.text(px + 10, 56,
            '#include <iostream>\n#include <stack>\nusing namespace std;\n\nint main() {\n\n\n    return 0;\n}',
            { fontSize: '11px', color: '#6a9955', fontFamily: 'monospace' }
        );
        const btnY = 420;
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x2d6a1f, 1);
        btnBg.fillRoundedRect(cx - 68, btnY - 15, 136, 30, 6);

        this.add.text(cx, btnY, '▶  Выполнить', {
            fontSize: '13px', color: '#ffffff',
        }).setOrigin(0.5);

        const btnZone = this.add.zone(cx, btnY, 136, 30).setInteractive({ useHandCursor: true });
        btnZone.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0x3d8a2f, 1);
            btnBg.fillRoundedRect(cx - 68, btnY - 15, 136, 30, 6);
        });
        btnZone.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x2d6a1f, 1);
            btnBg.fillRoundedRect(cx - 68, btnY - 15, 136, 30, 6);
        });

        const outBg = this.add.graphics();
        outBg.fillStyle(0x0d1117, 0.7);
        outBg.fillRoundedRect(px, 462, pw, 110, 6);
        outBg.lineStyle(1, 0x30304a);
        outBg.strokeRoundedRect(px, 462, pw, 110, 6);

        this.add.text(px + 8, 470, '> вывод программы', {
            fontSize: '11px', color: '#444466', fontFamily: 'monospace',
        });
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
}
