import { unlockSceneAudio, playSparkle } from '../music.js';

/** Oyun başlığı — değiştirmek için burayı düzenle */
export const GAME_TITLE = 'Yıldızlara';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.fadeIn(800, 0, 0, 0);
    unlockSceneAudio(this);

    this.createBackground();
    this.createStars();
    this.createTitle();
    this.createStartButton();
  }

  createBackground() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x070818, 0x070818, 0x151845, 0x1a1040, 1);
    bg.fillRect(0, 0, 800, 450);

    const glow = this.add.graphics().setDepth(1);
    glow.fillStyle(0x6b4cff, 0.06);
    glow.fillCircle(400, 200, 220);
    glow.fillStyle(0xff88aa, 0.04);
    glow.fillCircle(520, 280, 160);
  }

  createStars() {
    this.menuStars = [];
    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 380);
      const r = Phaser.Math.FloatBetween(0.6, 2.2);
      const star = this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.15, 0.75)).setDepth(2);
      star.setData('phase', Phaser.Math.Between(0, 1000));
      this.menuStars.push(star);
    }
  }

  createTitle() {
    this.add
      .text(400, 168, GAME_TITLE, {
        fontFamily: 'Segoe UI, Georgia, serif',
        fontSize: '52px',
        color: '#ffe8cc',
        fontStyle: 'italic',
        stroke: '#ff88aa',
        strokeThickness: 1,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#ffeeaa',
          blur: 16,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(400, 228, '♥', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#ff6688',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0.85);
  }

  createStartButton() {
    const btnY = 310;
    const glow = this.add.rectangle(400, btnY, 200, 54, 0xffeeaa, 0.08).setDepth(9);

    const btn = this.add
      .rectangle(400, btnY, 180, 48, 0x6b4cff, 0.92)
      .setStrokeStyle(2, 0xffeeaa, 0.7)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    const label = this.add
      .text(400, btnY, 'Başla', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.tweens.add({
      targets: glow,
      scaleX: { from: 1, to: 1.08 },
      scaleY: { from: 1, to: 1.12 },
      alpha: { from: 0.06, to: 0.14 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    btn.on('pointerover', () => {
      btn.setFillStyle(0x8066ff, 0.98);
      label.setColor('#ffeeaa');
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(0x6b4cff, 0.92);
      label.setColor('#ffffff');
    });
    btn.on('pointerdown', () => {
      btn.disableInteractive();
      if (this.sound.context?.state === 'suspended') {
        this.sound.context.resume();
      }
      this.sound.unlock();
      playSparkle(this);

      this.registry.set('collectedStars', []);
      this.registry.set('gameComplete', false);
      this.registry.set('introSeen', false);

      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('SkyScene');
      });
    });
  }

  update(time) {
    this.menuStars?.forEach((star) => {
      const phase = star.getData('phase') || 0;
      star.setAlpha(0.2 + (Math.sin((time + phase) * 0.002) + 1) * 0.28);
    });
  }
}
