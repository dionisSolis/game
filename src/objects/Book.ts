import Phaser from 'phaser';

export const DEFAULT_BOOK_H = 100;
const BOOK_COLORS = [0x8b4513, 0x2e4a7a, 0x4a7a2e, 0x7a3a6e, 0x3a6e7a, 0x6e6e3a];

export class Book extends Phaser.GameObjects.Container {
    readonly bookName: string;
    readonly bookW: number;
    readonly bookH: number;
    readonly significance: number;
    static colorIndex = 0;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        bookName: string,
        significance: number = 3,
        colorIndex?: number,
        customWidth?: number,
        customHeight?: number,
    ) {
        super(scene, x, y);

        this.bookName = bookName;
        this.significance = significance;
        
        // Используем кастомные размеры или вычисляем по умолчанию
        this.bookW = customWidth ?? (250 - (significance - 1) * 16);
        this.bookH = customHeight ?? DEFAULT_BOOK_H;

        const color = BOOK_COLORS[(colorIndex ?? Book.colorIndex++) % BOOK_COLORS.length];
        
        const slugify = (s: string) => s.toString().toLowerCase().replace(/[^a-z0-9а-яё]+/g, '_');
        const idx = ((colorIndex ?? Book.colorIndex++) % BOOK_COLORS.length) + 1;
        const candidates = [
            slugify(bookName),
            `book${idx}`,
            'book',
        ];

        let texKey: string | null = null;
        for (const c of candidates) {
            if (c && scene.textures.exists(c)) {
                texKey = c;
                break;
            }
        }

        console.debug('[Book] create', { bookName, candidates, texKey, size: `${this.bookW}x${this.bookH}` });

        // Позиционируем текст внизу книги (с отступом 20px от низа)
        const label = scene.add.text(this.bookW / 2.5, this.bookH / 1.9, bookName, {
            fontSize: '12px',
            color: '#ffffff',
            wordWrap: { width: this.bookW - 8 },
            align: 'center',
            padding: { x: 4, y: 2 },
        }).setOrigin(0.5);

        if (texKey) {
            const img = scene.add.image(0, 0, texKey).setOrigin(0, 0);
            img.setDisplaySize(this.bookW, this.bookH);
            this.add([img, label]);
        } else {
            const spine = scene.add.graphics();
            spine.fillStyle(color, 1);
            spine.fillRect(0, 0, this.bookW, this.bookH);
            spine.fillStyle(0xffffff, 0.15);
            spine.fillRect(0, 0, 8, this.bookH);
            spine.fillStyle(0x000000, 0.25);
            spine.fillRect(0, this.bookH - 6, this.bookW, 6);
            this.add([spine, label]);
        }
        this.setSize(this.bookW, this.bookH);
        scene.add.existing(this);
    }

    moveToAsync(x: number, y: number, duration = 400): Promise<void> {
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this,
                x, y,
                duration,
                ease: 'Quad.easeInOut',
                onComplete: () => resolve(),
            });
        });
    }

    stackOnTop(ofBook?: Book, offsetY = 0): Promise<void> {
        const tx = ofBook ? ofBook.x : this.x;
        const ty = ofBook ? ofBook.y - offsetY : this.y - offsetY;
        return this.moveToAsync(tx, ty, 380);
    }

    pop(duration = 300): Promise<void> {
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                scaleX: 0.6,
                scaleY: 0.6,
                y: this.y - 30,
                duration,
                ease: 'Quad.easeIn',
                onComplete: () => { this.destroy(); resolve(); },
            });
        });
    }
}