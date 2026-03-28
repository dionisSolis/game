import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubScene }  from './scenes/HubScene';
import { TestScene } from './scenes/TestScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [BootScene, HubScene, TestScene],
};

new Phaser.Game(config);
