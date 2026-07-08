import { unlockSceneAudio, playMessagePing, playTypingTick } from '../music.js';

const CHAT_SCRIPT = [
  { from: 'player', type: 'image_choice', key: 'memory1_photo', label: '📷  Fotoğraf gönder' },
  { from: 'him', type: 'tap', text: 'baya kafamız uyuşuyor beğenildi' },
  { from: 'player', type: 'choice', text: 'Ezistan\'a yolculuğunuz gecikmiş' },
  { from: 'him', type: 'tap', text: 'İstanbul\'a geliyorum haberin olsun, buluşalım mı?' },
  { from: 'player', type: 'choice', text: 'olur dağ ayısı gibi bi vibeın var ama bebek poposuymuş meğerse' },
];

const HIM_TYPING_MS = 2000;
const STEP_PAUSE_MS = 900;
const BUBBLE_FADE_MS = 500;

export class PhoneChatScene extends Phaser.Scene {
  constructor() {
    super('PhoneChatScene');
  }

  init(data) {
    this.starId = data.starId;
    this.stepIndex = 0;
    this.messageY = 0;
    this.chatItems = [];
    this.uiElements = [];
    this.typingDots = null;
  }

  preload() {
    this.load.image('memory1_photo', 'assets/memory1_photo.png');
  }

  create() {
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    unlockSceneAudio(this);

    this.createBedroomBackground();
    this.buildPhone();

    this.time.delayedCall(700, () => this.startNextStep());
  }

  createBedroomBackground() {
    const bg = this.add.image(400, 225, 'memory1_photo');
    bg.setDisplaySize(900, 506);
    bg.setAlpha(0.55);
    bg.setDepth(0);

    if (bg.preFX) {
      bg.preFX.addBlur(0, 3, 3, 1);
    }

    this.add.rectangle(400, 225, 800, 450, 0x0a0812, 0.45).setDepth(1);
  }

  buildPhone() {
    const cx = 400;
    const cy = 225;

    this.phoneFrame = this.add.rectangle(cx, cy, 290, 420, 0x14141c, 0.92).setStrokeStyle(3, 0x3a3a4a).setDepth(2);
    this.add.rectangle(cx, cy - 195, 100, 16, 0x0a0a10).setStrokeStyle(1, 0x2a2a3a).setDepth(2);

    this.add
      .text(cx, cy - 168, 'Vahit', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .text(cx, cy - 152, 'çevrimiçi', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '10px',
        color: '#66cc88',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add.rectangle(cx, cy - 138, 260, 1, 0x2a2a3a).setDepth(2);

    this.chatTop = cy - 128;
    this.chatBottom = cy + 130;
    this.chatX = cx;
    this.chatWidth = 250;
    this.messageY = this.chatTop + 8;

    this.add.rectangle(cx, cy + 148, 260, 52, 0x0e0e14, 0.9).setStrokeStyle(1, 0x222230).setDepth(2);
  }

  trackChatItem(...objects) {
    this.chatItems.push({ objects, baseY: this.messageY });
  }

  scrollChat() {
    const limit = this.chatBottom - 70;
    while (this.messageY > limit && this.chatItems.length > 0) {
      const shift = Math.min(28, this.messageY - limit);
      this.chatItems.forEach((group) => {
        group.baseY -= shift;
        group.objects.forEach((obj) => {
          if (obj?.active) obj.y -= shift;
        });
      });
      this.messageY -= shift;
    }
  }

  fadeInObjects(objects, onComplete) {
    objects.forEach((obj) => obj.setAlpha(0));
    this.tweens.add({
      targets: objects,
      alpha: 1,
      duration: BUBBLE_FADE_MS,
      ease: 'Sine.easeOut',
      onComplete,
    });
  }

  startNextStep() {
    this.clearUI();

    if (this.stepIndex >= CHAT_SCRIPT.length) {
      this.endChat();
      return;
    }

    const step = CHAT_SCRIPT[this.stepIndex];

    if (step.type === 'choice') {
      this.showReplyChip(step.text, step.type);
      return;
    }

    if (step.type === 'image_choice') {
      this.showReplyChip(step.label, step.type, step.key);
      return;
    }

    if (step.type === 'tap') {
      this.showHimMessage(step.text);
    }
  }

  showTypingIndicator() {
    return new Promise((resolve) => {
      const dots = this.add
        .text(this.chatX - 100, this.messageY, '...', {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '18px',
          color: '#9999aa',
        })
        .setOrigin(0, 0)
        .setDepth(6)
        .setAlpha(0);

      this.typingDots = dots;
      this.tweens.add({ targets: dots, alpha: 1, duration: 300 });

      let count = 0;
      const timer = this.time.addEvent({
        delay: 400,
        repeat: Math.floor(HIM_TYPING_MS / 400) - 1,
        callback: () => {
          count = (count + 1) % 4;
          dots.setText('.'.repeat(count || 1));
          playTypingTick(this);
        },
      });

      this.time.delayedCall(HIM_TYPING_MS, () => {
        timer.destroy();
        this.tweens.add({
          targets: dots,
          alpha: 0,
          duration: 250,
          onComplete: () => {
            dots.destroy();
            this.typingDots = null;
            resolve();
          },
        });
      });
    });
  }

  async showTypingThen(callback) {
    await this.waitPromise(this.showTypingIndicator());
    callback();
  }

  waitPromise(promise) {
    if (promise && typeof promise.then === 'function') {
      return promise;
    }
    return Promise.resolve();
  }

  addImageBubble(key, from = 'player') {
    const img = this.add.image(0, 0, key).setDepth(5);
    const maxW = 155;
    img.setScale(maxW / img.width);

    const pad = 6;
    const bubbleW = img.displayWidth + pad * 2;
    const bubbleH = img.displayHeight + pad * 2;
    const isPlayer = from === 'player';
    const bx = isPlayer
      ? this.chatX + this.chatWidth / 2 - bubbleW - 8
      : this.chatX - this.chatWidth / 2 + 8;
    const by = this.messageY + bubbleH / 2;
    const color = isPlayer ? 0x6b4cff : 0x252530;

    const bg = this.add.rectangle(bx, by, bubbleW, bubbleH, color).setOrigin(0, 0.5).setDepth(4);
    img.setPosition(bx + pad + img.displayWidth / 2, by);

    this.trackChatItem(bg, img);
    this.messageY += bubbleH + 12;
    this.scrollChat();
    this.fadeInObjects([bg, img]);
    playMessagePing(this, from === 'player' ? 'send' : 'receive');
  }

  addTextBubble(text, from) {
    const isPlayer = from === 'player';
    const maxWidth = 165;
    const txt = this.add
      .text(0, 0, text, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        wordWrap: { width: maxWidth },
        lineSpacing: 3,
      })
      .setOrigin(0, 0)
      .setDepth(6);

    const padX = 10;
    const padY = 8;
    const bubbleW = txt.width + padX * 2;
    const bubbleH = txt.height + padY * 2;

    const bx = isPlayer
      ? this.chatX + this.chatWidth / 2 - bubbleW - 8
      : this.chatX - this.chatWidth / 2 + 8;
    const by = this.messageY + bubbleH / 2;
    const color = isPlayer ? 0x6b4cff : 0x252530;

    const bg = this.add.rectangle(bx, by, bubbleW, bubbleH, color).setOrigin(0, 0.5).setDepth(5);
    txt.setPosition(bx + padX, by - txt.height / 2);

    this.trackChatItem(bg, txt);
    this.messageY += bubbleH + 10;
    this.scrollChat();
    this.fadeInObjects([bg, txt]);
    playMessagePing(this, from === 'player' ? 'send' : 'receive');
  }

  showReplyChip(text, type, imageKey = null) {
    const chip = this.add
      .rectangle(400, 395, 350, 48, 0x6b4cff, 0)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x9988ff)
      .setDepth(10);

    const label = this.add
      .text(400, 395, text, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setAlpha(0);

    chip.setAlpha(0);
    label.setAlpha(0);
    this.tweens.add({ targets: chip, alpha: 0.95, duration: 400 });
    this.tweens.add({ targets: label, alpha: 1, duration: 400 });

    chip.on('pointerover', () => chip.setFillStyle(0x8066ff, 0.95));
    chip.on('pointerout', () => chip.setFillStyle(0x6b4cff, 0.95));
    chip.on('pointerdown', () => {
      chip.disableInteractive();
      this.tweens.add({
        targets: [chip, label],
        alpha: 0,
        duration: 250,
        onComplete: () => {
          chip.destroy();
          label.destroy();

          if (type === 'image_choice') {
            this.addImageBubble(imageKey, 'player');
          } else {
            this.addTextBubble(text, 'player');
          }

          this.stepIndex++;
          this.time.delayedCall(STEP_PAUSE_MS + BUBBLE_FADE_MS, () => this.startNextStep());
        },
      });
    });

    this.uiElements.push(chip, label);
  }

  showHimMessage(text) {
    this.showTypingThen(() => {
      this.addTextBubble(text, 'him');
      this.stepIndex++;

      this.time.delayedCall(STEP_PAUSE_MS, () => {
        const hint = this.add
          .text(400, 395, '[ Devam ]', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '14px',
            color: '#9999bb',
          })
          .setOrigin(0.5)
          .setDepth(10)
          .setAlpha(0)
          .setInteractive({ useHandCursor: true });

        this.tweens.add({ targets: hint, alpha: 1, duration: 400 });

        hint.on('pointerover', () => hint.setColor('#ffffff'));
        hint.on('pointerout', () => hint.setColor('#9999bb'));
        hint.on('pointerdown', () => {
          hint.disableInteractive();
          this.tweens.add({
            targets: hint,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              hint.destroy();
              this.time.delayedCall(400, () => this.startNextStep());
            },
          });
        });

        this.uiElements.push(hint);
      });
    });
  }

  clearUI() {
    this.uiElements.forEach((el) => el?.destroy());
    this.uiElements = [];
    if (this.typingDots) {
      this.typingDots.destroy();
      this.typingDots = null;
    }
  }

  endChat() {
    this.time.delayedCall(1200, () => {
      this.tweens.add({
        targets: this.phoneFrame,
        alpha: 0,
        duration: 800,
      });
      this.cameras.main.fadeOut(1600, 0, 0, 0);
      this.time.delayedCall(1600, () => this.finishMemory());
    });
  }

  finishMemory() {
    const collected = this.registry.get('collectedStars') || [];
    if (!collected.includes(this.starId)) {
      collected.push(this.starId);
      this.registry.set('collectedStars', collected);
    }
    this.scene.start('SkyScene');
  }
}
