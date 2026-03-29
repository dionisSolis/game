import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { Door } from '../objects/Door';
import { SaveManager } from '../utils/SaveManager';

const DOOR_X = GAME_WIDTH / 2;
const DOOR_Y = GAME_HEIGHT / 2 + 40;

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

    private drawBackground() {
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-hub');

        this.add.text(width / 2, 60, 'Библиотека', {
            fontSize: '32px',
            color: '#e8d5b0',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const line = this.add.graphics();
        line.lineStyle(2, 0xe8d5b0, 0.4);
        line.lineBetween(width / 2 - 120, 90, width / 2 + 120, 90);
    }

    private createDoor() {
        const door = new Door(this, DOOR_X, DOOR_Y, 'Уровень 1\nСтек');

        door.on('pointerdown', () => {
            door.open(() => this.scene.start('LevelStackScene'));
        });

        if (SaveManager.isLevelComplete('stack')) {
            this.add.text(DOOR_X + 50, DOOR_Y - 55, 'Пройдено', {
                fontSize: '28px',
                color: '#44ff88',
            }).setOrigin(0.5);
        }
    }

    private createUI(height: number) {
        this.add.text(16, height - 24, 'Нажми на дверь, чтобы войти', {
            fontSize: '12px',
            color: '#888866',
        });
    }
}