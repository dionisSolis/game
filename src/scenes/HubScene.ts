import Phaser from 'phaser';

const GAME_WIDTH  = 800;
const GAME_HEIGHT = 600;

const DOOR_X = GAME_WIDTH / 2;
const DOOR_Y = GAME_HEIGHT / 2 + 40;

export class HubScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HubScene' });
    }

    create() {
        this.drawBackground();
        this.createDoor();
        this.createUI();
    }

    // Пробка из BootScene
    private drawBackground() {
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-hub');

        this.add.text(GAME_WIDTH / 2, 60, 'Библиотека', {
            fontSize: '32px',
            color: '#e8d5b0',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const line = this.add.graphics();
        line.lineStyle(2, 0xe8d5b0, 0.4);
        line.lineBetween(GAME_WIDTH / 2 - 120, 90, GAME_WIDTH / 2 + 120, 90);
    }

    private createDoor() {
        const door = this.add.image(DOOR_X, DOOR_Y, 'door')
            .setInteractive({ useHandCursor: true });

        const label = this.add.text(DOOR_X, DOOR_Y + 75, 'Уровень 1\nСтек', {
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

    private createUI() {
        this.add.text(16, GAME_HEIGHT - 24, 'Нажми на дверь, чтобы войти', {
            fontSize: '12px',
            color: '#888866',
        });
    }
}
