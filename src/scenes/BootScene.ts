import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// Комментари (тут песня из уральских пельменей должна быть) 
// Список ассетов
const IMAGE_ASSETS = [
    { key: 'book',     path: 'assets/images/book.png' },
    { key: 'door',     path: 'assets/images/door.png' },
    { key: 'bg-hub',   path: 'assets/images/bg-hub.png' },
    { key: 'bg-level', path: 'assets/images/background.jpg' },
] as const;

const FALLBACK_PARAMS: Record<string, { w: number; h: number; color: number; label?: string }> = {
    'book':     { w: 60,  h: 80,  color: 0x8b4513, label: 'book'  },
    'door':     { w: 80,  h: 120, color: 0x3a2a1a, label: 'door'  },
    'bg-hub':   { w: GAME_WIDTH, h: GAME_HEIGHT, color: 0x2a1a3a },
    'bg-level': { w: GAME_WIDTH, h: GAME_HEIGHT, color: 0x1a2a1a },
};

export class BootScene extends Phaser.Scene {
    private failedKeys = new Set<string>();

    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.createLoadingUI();

        this.load.on('progress', (value: number) => {
            this.updateProgressBar(value);
        });

        this.load.on('loaderror', (file: Phaser.Loader.File) => {
            this.failedKeys.add(file.key);
        });

        IMAGE_ASSETS.forEach(({ key, path }) => this.load.image(key, path));
    }

    create() {
        this.generateFallbackTextures();
        this.scene.start('HubScene');
    }

    private progressBar!: Phaser.GameObjects.Graphics;
    private progressBox!: Phaser.GameObjects.Graphics;

    private createLoadingUI() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.add.text(cx, cy - 60, 'Загрузка...', {
            fontSize: '20px',
            color: '#aaaacc',
        }).setOrigin(0.5);

        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222244, 0.8);
        this.progressBox.fillRoundedRect(cx - 160, cy - 15, 320, 30, 6);

        this.progressBar = this.add.graphics();
    }

    private updateProgressBar(value: number) {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.progressBar.clear();
        this.progressBar.fillStyle(0x6666cc, 1);
        this.progressBar.fillRoundedRect(cx - 156, cy - 11, 312 * value, 22, 4);
    }

    private generateFallbackTextures() {
        for (const [key, params] of Object.entries(FALLBACK_PARAMS)) {
            if (this.failedKeys.has(key) || !this.textures.exists(key)) {
                const g = this.make.graphics({ add: false });

                g.fillStyle(params.color, 1);
                g.fillRect(0, 0, params.w, params.h);

                g.lineStyle(1, 0xffffff, 0.2);
                g.strokeRect(0, 0, params.w, params.h);

                g.generateTexture(key, params.w, params.h);
                g.destroy();

                console.warn(`[BootScene] Заглушка для "${key}" (PNG не найден)`);
            }
        }
    }
}
