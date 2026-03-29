import Phaser from 'phaser';

const BOOK_W = 60;
const BOOK_H = 80;

const BOOK_COLORS = [0x8b4513, 0x2e4a7a, 0x4a7a2e, 0x7a3a6e, 0x3a6e7a, 0x6e6e3a];

export class Book extends Phaser.GameObjects.Container {
    readonly bookName: string;

    static colorIndex = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, bookName: string, colorIndex?: number) {
        super(scene, x, y);

        this.bookName = bookName;

        const color = BOOK_COLORS[(colorIndex ?? Book.colorIndex++) % BOOK_COLORS.length];

        const spine = scene.add.graphics();
        spine.fillStyle(color, 1);
        spine.fillRect(0, 0, BOOK_W, BOOK_H);

        spine.fillStyle(0xffffff, 0.15);
        spine.fillRect(0, 0, 8, BOOK_H);

        spine.fillStyle(0x000000, 0.25);
        spine.fillRect(0, BOOK_H - 6, BOOK_W, 6);

        const label = scene.add.text(BOOK_W / 2, BOOK_H / 2, bookName, {
            fontSize: '10px',
            color: '#ffffff',
            wordWrap: { width: BOOK_W - 10 },
            align: 'center',
        }).setOrigin(0.5);

        this.add([spine, label]);
        this.setSize(BOOK_W, BOOK_H);

        scene.add.existing(this);
    }

    moveTo(x: number, y: number, duration: number = 400): Promise<void> {
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets:  this,
                x, y,
                duration,
                ease:     'Quad.easeInOut',
                onComplete: () => resolve(),
            });
        });
    }

    stackOnTop(ofBook?: Book, offsetY: number = 0): Promise<void> {
        const targetX = ofBook ? ofBook.x : this.x;
        const targetY = ofBook ? ofBook.y - offsetY : this.y - offsetY;
        return this.moveTo(targetX, targetY, 380);
    }

    pop(duration: number = 300): Promise<void> {
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets:  this,
                alpha:    0,
                scaleX:   0.6,
                scaleY:   0.6,
                y:        this.y - 30,
                duration,
                ease:     'Quad.easeIn',
                onComplete: () => {
                    this.destroy();
                    resolve();
                },
            });
        });
    }
}
