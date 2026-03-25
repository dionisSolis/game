import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Пока без картинок, рисуем графикой
    }

    create() {
        // Рисуем красный квадрат как книгу
        const graphics = this.add.graphics();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(100, 100, 50, 70);
        
        // Текст
        this.add.text(100, 200, 'Книга', { color: '#ffffff' });
        this.add.text(100, 250, 'Phaser работает!', { color: '#00ff00' });
        
        console.log('Игра запущена!');
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container', // вставим в div с этим id
    scene: BootScene,
    backgroundColor: '#1a1a2e'
};

new Phaser.Game(config);