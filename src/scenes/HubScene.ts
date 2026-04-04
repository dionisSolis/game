import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { Door } from '../objects/Door';
import { SaveManager } from '../utils/SaveManager';

const DOOR_X = GAME_WIDTH * 0.09;
const DOOR_Y = GAME_HEIGHT * 0.4;

export class HubScene extends Phaser.Scene {
    private ghost: Phaser.GameObjects.Image | null = null;
    private isLevelComplete: boolean = false;

    constructor() {
        super({ key: 'HubScene' });
    }

    create() {
        window.setGameFullWidth();
        this.cleanupEditor();

        // Проверяем, пройден ли уровень
        this.isLevelComplete = SaveManager.isLevelComplete('stack');

        this.drawBackground();
        this.createDoor();
        this.createGhost(); 
        this.createDialogBubble();
        this.createUI();
    }

    private createGhost() {
        if (!this.textures.exists('father')) return;

        const x = GAME_WIDTH / 2;   
        const y = GAME_HEIGHT / 2;   
        
        this.ghost = this.add.image(x, y, 'father');
        this.ghost.setScale(1.2);
    }

    private createDialogBubble() {
        if (!this.ghost) return;

        // Позиция окошка: справа сверху от призрака
        const bubbleX = this.ghost.x + 300;
        const bubbleY = this.ghost.y - 300;

        // Создаем контейнер для диалогового окна
        const container = this.add.container(bubbleX, bubbleY);
        
        // Рисуем фон для диалога
        const bubbleWidth = 320;
        const bubbleHeight = 200;
        
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0d0d20, 0.95);
        graphics.fillRoundedRect(0, 0, bubbleWidth, bubbleHeight, 12);
        graphics.lineStyle(2, 0x8866ff, 0.8);
        graphics.strokeRoundedRect(0, 0, bubbleWidth, bubbleHeight, 12);
        
        container.add(graphics);
        
        // Выбираем текст в зависимости от того, пройден ли уровень
        let messageText: string;
        if (this.isLevelComplete) {
            messageText = '👻 Молодец, сын! Ты прошел первый уровень отлично!\n\n' +
                         'Продолжай в том же духе!\n\n' +
                         'Впереди тебя ждут новые испытания,\n' +
                         'но я верю, что ты справишься!';
        } else {
            messageText = '👻 Сынок… Инквизитор Верификус заточил меня ' +
                         'в темницу и разрушил магические данные замка.\n' +
                         'Без них меня не освободить.\n\n' +
                         'Ты должен восстановить порядок — структуры ' +
                         'данных и алгоритмы — и найти ключ.\n\n' +
                         'Начни с первой двери, там тебе поможет\n' +
                         'кошка Рекурсия. Действуй, время уходит…';
        }
        
        // Добавляем текст
        const text = this.add.text(12, 15, messageText, {
            fontSize: '14px',
            color: '#e0e0ff',
            fontFamily: 'monospace',
            wordWrap: { width: bubbleWidth - 20 },
        });
        
        container.add(text);
        
        // Добавляем анимацию появления
        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 500,
            ease: 'Quad.easeOut',
            delay: 500
        });
        
        // Пульсация окошка для привлечения внимания
        this.tweens.add({
            targets: container,
            scale: 1.02,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
    }

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
        const door = new Door(this, DOOR_X + 50, DOOR_Y - 10, 'Уровень 1\nСтек');
        door.hideSprite();

        door.on('pointerdown', () => {
            door.open(() => this.scene.start('LevelStackScene'));
        });

        if (this.isLevelComplete) {
            this.add.text(DOOR_X + 50, DOOR_Y - 75, 'Пройдено', {
                fontSize: '28px',
                color: '#44ff88',
            }).setOrigin(0.5);
        }
    }

    private createUI() {
        this.add.text(16, GAME_HEIGHT - 24, 'Нажми на уровень, чтобы войти', {
            fontSize: '12px',
            color: '#888866',
        });
    }

    private cleanupEditor() {
        const editorContainer = document.getElementById('code-editor-container');
        if (editorContainer) {
            editorContainer.remove();
        }
        window.showExecuteButton(false);
    }
}