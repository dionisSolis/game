import Phaser from 'phaser';

export class Door extends Phaser.GameObjects.Image {
    isOpen = false;

    private label: Phaser.GameObjects.Text;
    private spriteHidden = false;

    constructor(scene: Phaser.Scene, x: number, y: number, labelText: string) {
        super(scene, x, y, 'door');

        scene.add.existing(this);
    // scale the door image to 80% of its original size
        this.setScale(0.7);
        this.setInteractive({ useHandCursor: true });

        this.label = scene.add.text(x, y + 75, labelText, {
            fontSize: '14px',
            color: '#e8d5b0',
            align: 'center',
        }).setOrigin(0.5, 0);
        // Make the label interactive too so clicking the visible text works when the sprite is hidden
        this.label.setInteractive({ useHandCursor: true });
        // When the label is clicked, re-emit the same "pointerdown" event on the Door
        // so external listeners attached to the Door (e.g. in HubScene) are invoked
        this.label.on('pointerdown', (...args: any[]) => {
            // forward the input event to the door object so HubScene's handler runs
            this.emit('pointerdown', ...args as any);
        });
        this.label.on('pointerover', () => this.onHoverIn());
        this.label.on('pointerout',  () => this.onHoverOut());

        this.on('pointerover', () => this.onHoverIn());
        this.on('pointerout',  () => this.onHoverOut());
    }

    /**
     * Сделать сам спрайт двери невидимым, но сохранить интерактивность и поведение.
     * Если hideLabel = true, подпись также будет скрыта.
     */
    hideSprite(hideLabel: boolean = false) {
        this.spriteHidden = true;
        // скрываем изображение (alpha = 0) — это не отключает интерактивность
        this.setAlpha(0);
        if (hideLabel) this.label.setAlpha(0);
    }

    /** Включить видимость спрайта и подписи обратно. */
    showSprite() {
        this.spriteHidden = false;
        this.setAlpha(1);
        this.label.setAlpha(1);
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
        // Если спрайт скрыт, не анимируем его — оставляем только подсветку подписи
        if (this.spriteHidden) {
            this.label.setStyle({ color: '#ffffff' });
            return;
        }

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
        if (this.spriteHidden) {
            this.label.setStyle({ color: '#e8d5b0' });
            return;
        }

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
