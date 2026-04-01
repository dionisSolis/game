import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { BootScene }       from './scenes/BootScene';
import { HubScene }        from './scenes/HubScene';
import { LevelStackScene } from './scenes/LevelStackScene';
import { TestScene }       from './scenes/TestScene';

const getConfig = () => ({
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [BootScene, HubScene, LevelStackScene, TestScene],
});

const game = new Phaser.Game(getConfig());
window.game = game;

// UI элементы
const button = document.createElement('button');
button.className = 'execute-btn';
button.textContent = '▶ Выполнить код';
button.style.display = 'none';
document.body.appendChild(button);

const output = document.createElement('div');
output.className = 'executing-indicator';
output.style.display = 'none';
document.body.appendChild(output);

// Глобальные функции
window.showExecuteButton = (show: boolean) => {
    button.style.display = show ? 'block' : 'none';
};

window.setExecuteHandler = (handler: () => Promise<void>) => {
    button.onclick = async () => {
        await handler();
    };
};

window.showOutput = (text: string, isError: boolean = false) => {
    output.textContent = text;
    output.style.display = 'block';
    output.style.backgroundColor = isError ? 'rgba(200, 50, 50, 0.9)' : 'rgba(0, 0, 0, 0.8)';
    
    setTimeout(() => {
        output.style.display = 'none';
    }, 5000);
};

window.setExecuteButtonState = (disabled: boolean, text?: string) => {
    button.disabled = disabled;
    button.textContent = text || '▶ Выполнить код';
};

window.setGameFullWidth = () => {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.width = '100%';
    }
    window.game.scale.resize(window.innerWidth, window.innerHeight);
};

window.setGameHalfWidth = () => {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.width = '65%';
    }
    window.game.scale.resize(window.innerWidth * 0.65, window.innerHeight);
};

window.addEventListener('resize', () => {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer && gameContainer.style.width === '50%') {
        window.game.scale.resize(window.innerWidth / 2, window.innerHeight);
    } else {
        window.game.scale.resize(window.innerWidth, window.innerHeight);
    }
});

declare global {
    interface Window {
        showExecuteButton: (show: boolean) => void;
        setExecuteHandler: (handler: () => Promise<void>) => void;
        showOutput: (text: string, isError?: boolean) => void;
        setExecuteButtonState: (disabled: boolean, text?: string) => void;
        setGameFullWidth: () => void;
        setGameHalfWidth: () => void;
        game: Phaser.Game;
    }
}