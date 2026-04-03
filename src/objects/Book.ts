import Phaser from 'phaser';

export const BOOK_H = 110;
const BOOK_COLORS = [0x8b4513, 0x2e4a7a, 0x4a7a2e, 0x7a3a6e, 0x3a6e7a, 0x6e6e3a];

export class Book extends Phaser.GameObjects.Container {
    readonly bookName: string;
    readonly bookW: number;
    readonly significance: number;

    static colorIndex = 0;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        bookName: string,
        significance: number = 3,
        colorIndex?: number,
    ) {
        super(scene, x, y);

        this.bookName    = bookName;
        this.significance = significance;
        this.bookW       = 108 - (significance - 1) * 16;

        const color = BOOK_COLORS[(colorIndex ?? Book.colorIndex++) % BOOK_COLORS.length];

        const spine = scene.add.graphics();
        spine.fillStyle(color, 1);
        spine.fillRect(0, 0, this.bookW, BOOK_H);
        spine.fillStyle(0xffffff, 0.15);
        spine.fillRect(0, 0, 8, BOOK_H);
        spine.fillStyle(0x000000, 0.25);
        spine.fillRect(0, BOOK_H - 6, this.bookW, 6);

        const label = scene.add.text(this.bookW / 2, BOOK_H / 2, bookName, {
            fontSize: '11px',
            color: '#ffffff',
            wordWrap: { width: this.bookW - 8 },
            align: 'center',
        }).setOrigin(0.5);

        this.add([spine, label]);
        this.setSize(this.bookW, BOOK_H);
        scene.add.existing(this);
    }

    moveTo(x: number, y: number, duration = 400): Promise<void> {
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
        return this.moveTo(tx, ty, 380);
    }

    pop(duration = 300): Promise<void> {
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets:  this,
                alpha:    0,
                scaleX:   0.6,
                scaleY:   0.6,
                y:        this.y - 30,
                duration,
                ease:     'Quad.easeIn',
                onComplete: () => { this.destroy(); resolve(); },
            });
        });
    }
}
