import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { BootScene }       from './scenes/BootScene';
import { HubScene }        from './scenes/HubScene';
import { LevelStackScene } from './scenes/LevelStackScene';
import { TestScene }       from './scenes/TestScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [BootScene, HubScene, LevelStackScene, TestScene],
};

new Phaser.Game(config);
