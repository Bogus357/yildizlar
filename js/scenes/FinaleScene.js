import { bindSceneMusic, playSparkle, playCheerBurst, playRomanticChime, kickstartSceneAudio, stopAllAudio } from '../music.js';
import { getSpeakerName } from '../dialogueNames.js';
import { getStarTextPoints } from '../starText.js';

const CHAR_HEIGHT = 96;
const WORLD_W = 2600;
const WORLD_H = 450;
const DIALOGUE_Y = 168;

export class FinaleScene extends Phaser.Scene {
  constructor() {
    super('FinaleScene');
  }

  init(data) {
    this.starId = data.starId ?? 4;
    this.futureStars = [];
    this.loveMessageStars = [];
    this.uiLayer = [];
    this.hearts = [];
    this.starsRevealed = false;
  }

  preload() {
    if (!this.textures.exists('girl')) this.load.image('girl', 'assets/girl.png');
    if (!this.textures.exists('boy')) this.load.image('boy', 'assets/boy.png');
  }

  create() {
    this.cameras.main.fadeIn(900, 0, 0, 0);
    bindSceneMusic(this, 'finale');
    kickstartSceneAudio(this, 'finale');
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.createSky();
    this.createFutureStarField();
    this.createStarLoveMessage();
    this.createCharacters();
    this.runSequence();
  }

  createSky() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x070818, 0x070818, 0x151845, 0x151845, 1);
    bg.fillRect(0, 0, WORLD_W, WORLD_H);

    for (let i = 0; i < 180; i++) {
      const x = Phaser.Math.Between(0, WORLD_W);
      const y = Phaser.Math.Between(0, WORLD_H * 0.75);
      bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.15, 0.9));
      bg.fillCircle(x, y, Phaser.Math.FloatBetween(0.4, 2.2));
    }

    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(100, WORLD_W - 100);
      const y = Phaser.Math.Between(100, 320);
      const cloud = this.add.graphics({ x, y }).setDepth(1);
      cloud.fillStyle(0x334466, 0.2);
      cloud.fillEllipse(0, 0, Phaser.Math.Between(90, 160), Phaser.Math.Between(28, 50));
    }
  }

  drawStarShape(g, cx, cy, outer, inner, points) {
    const step = Math.PI / points;
    g.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = i * step - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();
  }

  createFutureStarField() {
    for (let i = 0; i < 160; i++) {
      const x = Phaser.Math.Between(1280, 2480);
      const y = Phaser.Math.Between(80, 400);
      const size = Phaser.Math.FloatBetween(0.6, 1.5);
      const star = this.add.graphics({ x, y }).setDepth(8).setAlpha(0);

      star.fillStyle(0xffeeaa, 0.55);
      this.drawStarShape(star, 0, 0, 6 * size, 2.5 * size, 5);
      star.setData('twinkleOffset', Phaser.Math.Between(0, 1000));

      this.futureStars.push(star);
    }
  }

  createStarLoveMessage() {
    const points = getStarTextPoints('Seni seviyorum', 1880, 218, 8);
    points.forEach((pt) => {
      const star = this.add.graphics({ x: pt.x, y: pt.y }).setDepth(21).setAlpha(0).setScale(0.2);
      star.fillStyle(0xffffcc, 1);
      star.fillStyle(0xffeeaa, 0.95);
      this.drawStarShape(star, 0, 0, 5.5, 2.2, 5);
      star.setData('revealOrder', pt.order);
      this.loveMessageStars.push(star);
    });
  }

  createCharacters() {
    const baseY = 340;
    this.girl = this.add.sprite(380, baseY, 'girl');
    this.girl.setOrigin(0.5, 1);
    this.girl.setScale(CHAR_HEIGHT / this.girl.height);
    this.girl.setDepth(15);

    this.boy = this.add.sprite(920, baseY, 'boy');
    this.boy.setOrigin(0.5, 1);
    this.boy.setScale((CHAR_HEIGHT + 6) / this.boy.height);
    this.boy.setDepth(15);
    this.boy.setAlpha(0);

    this.boyBaseX = 560;
    this.cameras.main.centerOn(400, 225);
  }

  runSequence() {
    this.tweens.add({
      targets: this.boy,
      x: this.boyBaseX,
      alpha: 1,
      duration: 1200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => this.stepBoyLookAhead());
      },
    });
  }

  stepBoyLookAhead() {
    this.showDialogue('boy', 'İleriye bak, ne görüyorsun?', 520, DIALOGUE_Y, () => {
      this.panCamera(1750, 225, 2800, () => {
        this.time.delayedCall(1800, () => this.stepPanBackToCouple());
      }, 700);
    });
  }

  stepPanBackToCouple() {
    this.panCamera(400, 225, 2400, () => {
      this.showDialogue('girl', 'Bir sürü yıldız… onlar niye ileride ki?', 210, DIALOGUE_Y, () => {
        this.time.delayedCall(2000, () => this.stepBoyFuture());
      });
    });
  }

  stepBoyFuture() {
    this.showDialogue(
      'boy',
      'Onlar daha ileride yaşayacağımız binlerce güzel anı.',
      590,
      DIALOGUE_Y,
      () => {
        this.time.delayedCall(2000, () => this.stepHearts());
      }
    );
  }

  stepHearts() {
    this.tweens.add({ targets: this.girl, x: 420, duration: 1400, ease: 'Sine.easeInOut' });
    this.tweens.add({
      targets: this.boy,
      x: 500,
      duration: 1400,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.spawnHearts();
        this.time.delayedCall(2000, () => this.stepFinalPan());
      },
    });
  }

  spawnHearts() {
    playRomanticChime(this);
    [this.girl, this.boy].forEach((char) => {
      const heart = this.add.text(char.x, char.y - char.displayHeight - 8, '♥', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '28px',
        color: '#ff6688',
      }).setOrigin(0.5).setDepth(18).setAlpha(0);

      this.hearts.push(heart);
      this.tweens.add({
        targets: heart,
        alpha: 1,
        y: heart.y - 18,
        duration: 700,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: heart,
            scale: { from: 1, to: 1.15 },
            duration: 450,
            yoyo: true,
            repeat: -1,
          });
        },
      });
    });
  }

  stepFinalPan() {
    this.clearUI();
    this.panCamera(1880, 225, 2600, () => {
      this.revealStarLoveMessage();
      playSparkle(this);
      playRomanticChime(this);
    }, 500);
  }

  revealStarLoveMessage() {
    this.loveMessageStars.forEach((star, i) => {
      this.tweens.add({
        targets: star,
        alpha: 1,
        scale: 1,
        duration: 320,
        delay: i * 38,
        ease: 'Back.easeOut',
      });
    });

    const writeDone = this.loveMessageStars.length * 38 + 400;
    this.time.delayedCall(writeDone + 5000, () => this.endGame());
  }

  panCamera(x, y, duration, onComplete, revealDelay = 0) {
    if (revealDelay > 0) {
      this.time.delayedCall(revealDelay, () => this.revealFutureStars());
    }
    this.cameras.main.once('camerapancomplete', () => onComplete?.());
    this.cameras.main.pan(x, y, duration, 'Sine.easeInOut');
  }

  revealFutureStars() {
    if (this.starsRevealed) return;
    this.starsRevealed = true;
    kickstartSceneAudio(this, 'finale');
    playSparkle(this);
    playCheerBurst(this, 0.6);

    this.futureStars.forEach((star, i) => {
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.45, 1),
        duration: 600 + (i % 8) * 40,
        delay: (i % 12) * 30,
      });
    });
  }

  showDialogue(from, text, boxX, boxY, onDone) {
    this.clearUI();

    const isGirl = from === 'girl';
    const bg = this.add.rectangle(boxX, boxY, 320, 72, isGirl ? 0x6b4cff : 0x3a2040, 0.93)
      .setDepth(30).setStrokeStyle(1, 0x88aaff);
    const name = this.add.text(boxX - 140, boxY - 32, getSpeakerName(from), {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '11px',
      color: isGirl ? '#ddd0ff' : '#ffbbbb',
      fontStyle: 'bold',
    }).setDepth(31);
    const txt = this.add.text(boxX - 140, boxY - 14, text, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: 270 },
    }).setDepth(31);

    this.uiLayer.push(bg, name, txt);

    this.time.delayedCall(3700, () => {
      this.clearUI();
      onDone?.();
    });
  }

  clearUI() {
    this.uiLayer.forEach((el) => el?.destroy());
    this.uiLayer = [];
  }

  endGame() {
    const collected = this.registry.get('collectedStars') || [];
    if (!collected.includes(this.starId)) {
      collected.push(this.starId);
      this.registry.set('collectedStars', collected);
    }
    this.registry.set('gameComplete', true);

    this.cameras.main.fadeOut(2000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      stopAllAudio();
      this.cameras.main.setScroll(0, 0);
      this.add.rectangle(400, 225, 800, 450, 0x050510).setScrollFactor(0).setDepth(100);
      this.add.text(400, 210, 'Seni seviyorum ♥', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '28px',
        color: '#ffe8cc',
        align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    });
  }

  update() {
    if (this.hearts?.length) {
      this.hearts.forEach((heart, i) => {
        const char = i === 0 ? this.girl : this.boy;
        if (heart?.active && char?.active) {
          heart.setPosition(char.x, char.y - char.displayHeight - 12);
        }
      });
    }

    if (!this.futureStars?.length) return;
    const t = this.time.now;
    this.futureStars.forEach((star) => {
      if (!star.active || star.alpha < 0.1) return;
      const off = star.getData('twinkleOffset') || 0;
      star.setScale(0.9 + Math.sin((t + off) * 0.004) * 0.12);
    });
  }
}
