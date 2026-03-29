import Phaser from 'phaser';

export class HubScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HubScene' });
    }

    create() {
        // Устанавливаем игру на всю ширину
        window.setGameFullWidth();
        
        const { width, height } = this.scale;

        this.drawBackground(width, height);
        this.createDoor(width, height);
        this.createUI(height);
    }

    private drawBackground(width: number, height: number) {
        this.add.image(width / 2, height / 2, 'bg-hub');

        this.add.text(width / 2, 60, 'Библиотека', {
            fontSize: '32px',
            color: '#e8d5b0',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const line = this.add.graphics();
        line.lineStyle(2, 0xe8d5b0, 0.4);
        line.lineBetween(width / 2 - 120, 90, width / 2 + 120, 90);
    }

    private createDoor(width: number, height: number) {
        const doorX = width / 2;
        const doorY = height / 2 + 40;

        const door = this.add.image(doorX, doorY, 'door')
            .setInteractive({ useHandCursor: true });

        const label = this.add.text(doorX, doorY + 75, 'Уровень 1\nСтек', {
            fontSize: '14px',
            color: '#e8d5b0',
            align: 'center',
        }).setOrigin(0.5, 0);

        door.on('pointerover', () => {
            this.tweens.add({
                targets: door,
                alpha: 0.75,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 120,
                ease: 'Quad.easeOut',
            });
            label.setStyle({ color: '#ffffff' });
        });

        door.on('pointerout', () => {
            this.tweens.add({
                targets: door,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 120,
                ease: 'Quad.easeIn',
            });
            label.setStyle({ color: '#e8d5b0' });
        });

        door.on('pointerdown', () => {
            door.disableInteractive();
            this.tweens.add({
                targets: [door, label],
                alpha: 0,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 300,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    this.cameras.main.fadeOut(200, 0, 0, 0);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        this.scene.start('TestScene');
                    });
                },
            });
        });
    }

    private createUI(height: number) {
        this.add.text(16, height - 24, 'Нажми на дверь, чтобы войти', {
            fontSize: '12px',
            color: '#888866',
        });
    }
}