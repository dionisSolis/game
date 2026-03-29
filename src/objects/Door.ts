import Phaser from 'phaser';

export class Door extends Phaser.GameObjects.Image {
    isOpen = false;

    private label: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, labelText: string) {
        super(scene, x, y, 'door');

        scene.add.existing(this);
        this.setInteractive({ useHandCursor: true });

        this.label = scene.add.text(x, y + 75, labelText, {
            fontSize: '14px',
            color: '#e8d5b0',
            align: 'center',
        }).setOrigin(0.5, 0);

        this.on('pointerover', () => this.onHoverIn());
        this.on('pointerout',  () => this.onHoverOut());
    }

    open(onComplete?: () => void) {
        if (this.isOpen) return; // чувак
        this.isOpen = true;

        this.disableInteractive();

        this.scene.tweens.add({
            targets:  [this, this.label],
            alpha:    0,
            scaleX:   0.9,
            scaleY:   0.9,
            duration: 300,
            ease:     'Quad.easeIn',
            onComplete: () => {
                this.scene.cameras.main.fadeOut(200, 0, 0, 0);
                this.scene.cameras.main.once('camerafadeoutcomplete', () => {
                    onComplete?.();
                });
            },
        });
    }

    private onHoverIn() {
        if (this.isOpen) return;
        this.scene.tweens.add({
            targets:  this,
            alpha:    0.75,
            scaleX:   1.05,
            scaleY:   1.05,
            duration: 120,
            ease:     'Quad.easeOut',
        });
        this.label.setStyle({ color: '#ffffff' });
    }

    private onHoverOut() {
        if (this.isOpen) return;
        this.scene.tweens.add({
            targets:  this,
            alpha:    1,
            scaleX:   1,
            scaleY:   1,
            duration: 120,
            ease:     'Quad.easeIn',
        });
        this.label.setStyle({ color: '#e8d5b0' });
    }
}
