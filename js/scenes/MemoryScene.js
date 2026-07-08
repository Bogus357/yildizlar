const MEMORIES = [
  {
    title: 'Anı 1 — İlk tanışma',
    text: 'O gün seni ilk gördüğümde,\ngökyüzündeki yıldızlar bile\nbir an için daha parlak gibiydi.\n\n(Bu metni kendi anınla değiştireceksin.)',
  },
];

export class MemoryScene extends Phaser.Scene {
  constructor() {
    super('MemoryScene');
  }

  init(data) {
    this.starId = data.starId;
    this.memoryIndex = data.memoryIndex ?? 0;
  }

  create() {
    const memory = MEMORIES[this.memoryIndex] || MEMORIES[0];

    this.add.rectangle(400, 225, 800, 450, 0x1a1040);

    const glow = this.add.graphics();
    glow.fillStyle(0xffeeaa, 0.08);
    glow.fillCircle(400, 180, 200);
    glow.fillStyle(0xffcc88, 0.12);
    glow.fillCircle(400, 180, 120);

    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(20, 780);
      const y = Phaser.Math.Between(20, 250);
      glow.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));
      glow.fillCircle(x, y, Phaser.Math.FloatBetween(0.5, 2));
    }

    const partner = this.add.sprite(400, 340, 'boy');
    partner.setOrigin(0.5, 1);
    partner.setScale(82 / partner.height);
    partner.setDepth(2);

    this.add
      .text(400, 60, memory.title, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#ffeeaa',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(400, 130, memory.text, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#e8eeff',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0);

    const continueBtn = this.add
      .text(400, 400, '[ Devam et — gökyüzüne dön ]', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#ffeeaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    continueBtn.on('pointerover', () => continueBtn.setColor('#ffffff'));
    continueBtn.on('pointerout', () => continueBtn.setColor('#ffeeaa'));
    continueBtn.on('pointerdown', () => this.finishMemory());

    this.input.keyboard.on('keydown-SPACE', () => this.finishMemory());
    this.input.keyboard.on('keydown-E', () => this.finishMemory());
  }

  finishMemory() {
    const collected = this.registry.get('collectedStars') || [];
    if (!collected.includes(this.starId)) {
      collected.push(this.starId);
      this.registry.set('collectedStars', collected);
    }
    this.scene.start('SkyScene');
  }

  preload() {
    if (!this.textures.exists('girl')) {
      this.load.image('girl', 'assets/girl.png');
    }
    if (!this.textures.exists('boy')) {
      this.load.image('boy', 'assets/boy.png');
    }
  }
}
