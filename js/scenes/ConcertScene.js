import { unlockSceneAudio, playHandRaiseCheer } from '../music.js';
import { getSpeakerName } from '../dialogueNames.js';

const ROUNDS = 8;
const CHAR_HEIGHT = 108;
const DIALOGUE_PRE_DELAY = 1200;
const DIALOGUE_POST_DELAY = 900;
const HAND_RAISE_MS = 650;
const HAND_LOWER_MS = 450;
const WALK_MS = 1000;
const ROUND_GAP_MS = 550;

export class ConcertScene extends Phaser.Scene {
  constructor() {
    super('ConcertScene');
  }

  init(data) {
    this.starId = data.starId;
    this.phase = 'intro';
    this.round = 0;
    this.isBusy = false;
    this.crowd = [];
    this.uiLayer = [];
    this.stageActors = [];
    this.ambientTweens = [];
  }

  preload() {
    if (!this.textures.exists('girl')) this.load.image('girl', 'assets/girl.png');
    if (!this.textures.exists('boy')) this.load.image('boy', 'assets/boy.png');
  }

  create() {
    this.cameras.main.fadeIn(800, 0, 0, 0);
    unlockSceneAudio(this);

    this.createStage();
    this.createBandAndSinger();
    this.createAudience();
    this.createCharacters();
    this.startAmbientMotion();
    this.showIntroDialogue();
  }

  createStage() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x120005, 0x120005, 0x550018, 0x2a000c, 1);
    bg.fillRect(0, 0, 800, 450);

    for (let i = 0; i < 7; i++) {
      const x = 60 + i * 115;
      const beam = this.add.graphics().setDepth(1);
      beam.fillStyle(0xff2244, 0.07);
      beam.fillTriangle(x, 0, x - 55, 200, x + 55, 200);
      this.tweens.add({
        targets: beam,
        alpha: { from: 0.5, to: 1 },
        duration: 900 + i * 120,
        yoyo: true,
        repeat: -1,
      });
    }

    this.pulseLight = this.add.rectangle(400, 95, 520, 140, 0xff2244, 0.08).setDepth(2);
    this.tweens.add({
      targets: this.pulseLight,
      alpha: { from: 0.05, to: 0.16 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
    });

    const stage = this.add.graphics().setDepth(3);
    stage.fillStyle(0x1a0810, 1);
    stage.fillRect(120, 118, 560, 14);
    stage.fillStyle(0x2a1018, 1);
    stage.fillRect(140, 132, 520, 48);
    stage.lineStyle(2, 0xff4466, 0.5);
    stage.strokeRect(140, 132, 520, 48);

    this.add.rectangle(90, 155, 36, 60, 0x0a0508).setDepth(4);
    this.add.rectangle(710, 155, 36, 60, 0x0a0508).setDepth(4);
    this.add.rectangle(400, 355, 840, 120, 0x080004, 0.55).setDepth(2);
  }

  createBandAndSinger() {
    this.createStageMusician(310, 158, 'guitar', 0x2a1520);
    this.createStageMusician(490, 158, 'guitar', 0x2a1520);
    this.createDrummer(400, 165);
    this.createSinger(400, 142);
  }

  createSinger(x, y) {
    const g = this.add.container(x, y).setDepth(6);
    const body = this.add.ellipse(0, 18, 22, 38, 0x4a1028);
    const head = this.add.circle(0, -8, 10, 0x4a1028);
    const hair = this.add.ellipse(0, -12, 18, 14, 0x220810);
    const mic = this.add.rectangle(14, 0, 4, 18, 0x888899);
    const micHead = this.add.circle(14, -10, 5, 0xaaaaaa);
    const arm = this.add.graphics();
    arm.lineStyle(3, 0x4a1028);
    arm.lineBetween(8, 4, 14, -6);
    g.add([body, head, hair, arm, mic, micHead]);

    this.stageActors.push(g);
    this.tweens.add({
      targets: g,
      y: y - 4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: g,
      angle: { from: -2, to: 2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.singerNotes = this.add.text(x, y - 45, '♪ ♫', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#ff8899',
    }).setOrigin(0.5).setDepth(7).setAlpha(0.7);

    this.tweens.add({
      targets: this.singerNotes,
      y: y - 58,
      alpha: { from: 0.3, to: 0.9 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }

  createStageMusician(x, y, type, color) {
    const g = this.add.container(x, y).setDepth(5);
    const body = this.add.ellipse(0, 14, 20, 34, color);
    const head = this.add.circle(0, -8, 9, color);
    if (type === 'guitar') {
      const guitar = this.add.ellipse(-8, 10, 14, 22, 0x553322);
      g.add([body, head, guitar]);
    } else {
      g.add([body, head]);
    }
    this.stageActors.push(g);
    this.tweens.add({
      targets: g,
      y: y + Phaser.Math.Between(-2, 2),
      angle: { from: -3, to: 3 },
      duration: Phaser.Math.Between(700, 1100),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createDrummer(x, y) {
    const g = this.add.container(x, y).setDepth(5);
    const body = this.add.ellipse(0, 12, 24, 28, 0x251018);
    const head = this.add.circle(0, -6, 8, 0x251018);
    const drum = this.add.ellipse(0, 18, 30, 12, 0x442222);
    g.add([drum, body, head]);
    this.stageActors.push(g);
    this.tweens.add({
      targets: g,
      y: y - 2,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createAudience() {
    const rows = [
      { y: 295, count: 14, spread: 540, xStart: 130 },
      { y: 268, count: 16, spread: 620, xStart: 90 },
      { y: 242, count: 18, spread: 680, xStart: 60 },
      { y: 218, count: 20, spread: 720, xStart: 40 },
      { y: 198, count: 22, spread: 760, xStart: 20 },
    ];

    let index = 0;
    rows.forEach((row) => {
      for (let i = 0; i < row.count; i++) {
        const t = row.count === 1 ? 0.5 : i / (row.count - 1);
        const x = row.xStart + t * row.spread;
        const y = row.y + Phaser.Math.Between(-4, 4);
        const scale = 0.85 + (450 - y) / 450 * 0.35;
        this.createCrowdPerson(index, x, y, scale, row.y >= 268);
        index++;
      }
    });
  }

  createCrowdPerson(index, x, y, scale, canInteract) {
    const container = this.add.container(x, y).setDepth(7 + Math.floor(y / 50));
    const bodyW = 26 * scale;
    const bodyH = 46 * scale;
    const body = this.add.ellipse(0, 0, bodyW, bodyH, 0x100008, 0.88);
    const head = this.add.circle(0, -28 * scale, 10 * scale, 0x100008, 0.92);
    const hands = this.add.graphics();

    container.add([body, head, hands]);
    container.setScale(1);
    this.drawHands(hands, 0, 0, 0, scale);

    const hitZone = this.add.circle(x, y - 42 * scale, 20 * scale, 0xff6688, 0);
    hitZone.setDepth(14);
    hitZone.disableInteractive();
    hitZone.on('pointerdown', () => this.onHandTapped(index));

    const person = {
      index,
      x,
      y,
      scale,
      canInteract,
      container,
      body,
      head,
      hands,
      hitZone,
      raised: false,
      handProgress: 0,
      handTween: null,
      swayOffset: Phaser.Math.Between(0, 1000),
    };

    this.crowd.push(person);
  }

  drawHands(gfx, x, y, progress, scale = 1) {
    gfx.clear();
    const t = Phaser.Math.Clamp(progress, 0, 1);
    gfx.lineStyle(3 * scale, 0x1a0008, 0.95);

    const lerp = (a, b) => a + (b - a) * t;

    const lSx = lerp(-12 * scale, -16 * scale);
    const lSy = lerp(-6 * scale, -8 * scale);
    const lEx = lerp(-18 * scale, -20 * scale);
    const lEy = lerp(10 * scale, -42 * scale);

    const rSx = lerp(12 * scale, 16 * scale);
    const rSy = lerp(-6 * scale, -8 * scale);
    const rEx = lerp(18 * scale, 20 * scale);
    const rEy = lerp(10 * scale, -42 * scale);

    gfx.lineBetween(x + lSx, y + lSy, x + lEx, y + lEy);
    gfx.lineBetween(x + rSx, y + rSy, x + rEx, y + rEy);

    if (t > 0.55) {
      const handAlpha = (t - 0.55) / 0.45;
      gfx.fillStyle(0xffeedd, 0.95 * handAlpha);
      gfx.fillCircle(x + lEx, y + lEy - 2 * scale, 5 * scale);
      gfx.fillCircle(x + rEx, y + rEy - 2 * scale, 5 * scale);
    }
  }

  animateHandRaise(person, onComplete) {
    person.handProgress = 0;
    if (person.handTween) person.handTween.stop();

    person.handTween = this.tweens.add({
      targets: person,
      handProgress: 1,
      duration: HAND_RAISE_MS,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        this.drawHands(person.hands, 0, 0, person.handProgress, person.scale);
      },
      onComplete: () => {
        person.handTween = null;
        playHandRaiseCheer(this);
        onComplete?.();
      },
    });
  }

  animateHandLower(person, onComplete) {
    if (person.handTween) person.handTween.stop();
    person.handProgress = person.handProgress ?? 1;

    person.handTween = this.tweens.add({
      targets: person,
      handProgress: 0,
      duration: HAND_LOWER_MS,
      ease: 'Sine.easeIn',
      onUpdate: () => {
        this.drawHands(person.hands, 0, 0, person.handProgress, person.scale);
      },
      onComplete: () => {
        person.handTween = null;
        onComplete?.();
      },
    });
  }

  startAmbientMotion() {
    this.crowd.forEach((person) => {
      this.startPersonCrowdMotion(person);
    });
  }

  startPersonCrowdMotion(person) {
    person.baseX = person.x;
    person.baseY = person.y;

    const drift = () => {
      if (!person.container?.active || person.raised) return;

      const offsetX = Phaser.Math.Between(-12, 12);
      const offsetY = Phaser.Math.Between(-8, 8);
      const targetX = Phaser.Math.Clamp(person.baseX + offsetX, person.baseX - 14, person.baseX + 14);
      const targetY = Phaser.Math.Clamp(person.baseY + offsetY, person.baseY - 10, person.baseY + 10);

      person.driftTween = this.tweens.add({
        targets: person.container,
        x: targetX,
        y: targetY,
        angle: Phaser.Math.Between(-4, 4),
        duration: Phaser.Math.Between(450, 850),
        ease: 'Sine.easeInOut',
        onComplete: () => {
          person.driftTween = null;
          drift();
        },
      });
    };

    drift();
  }

  stopPersonCrowdMotion(person) {
    if (person.driftTween) {
      person.driftTween.stop();
      person.driftTween = null;
    }
    this.tweens.killTweensOf(person.container);
  }

  resumePersonCrowdMotion(person) {
    person.container.x = person.baseX;
    person.container.y = person.baseY;
    person.container.angle = 0;
    this.startPersonCrowdMotion(person);
  }

  createCharacters() {
    const baseY = 400;
    this.girl = this.add.sprite(330, baseY, 'girl');
    this.girl.setOrigin(0.5, 1);
    this.girl.setScale(CHAR_HEIGHT / this.girl.height);
    this.girl.setDepth(15);

    this.boy = this.add.sprite(410, baseY, 'boy');
    this.boy.setOrigin(0.5, 1);
    this.boy.setScale((CHAR_HEIGHT + 4) / this.boy.height);
    this.boy.setDepth(15);

    this.charBaseY = baseY;
    this.startCharacterIdle();
  }

  startCharacterIdle() {
    if (this.charIdleTween) this.charIdleTween.stop();

    this.charIdleTween = this.tweens.add({
      targets: [this.girl, this.boy],
      y: this.charBaseY - 3,
      angle: { from: -1.5, to: 1.5 },
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  showIntroDialogue() {
    const lines = [
      { from: 'girl', text: 'Ben hiçbir şey göremiyorum, çok arkadayız.' },
      { from: 'boy', text: 'Evet, ben de görmeyi deneyelim mi?' },
      { from: 'girl', text: 'Olur hadi!' },
    ];
    this.runDialogue(lines, () => this.startMinigame());
  }

  showOutroDialogue() {
    const lines = [
      { from: 'girl', text: 'Hiç göremiyoruz ama sorun değil,\nyine de eğlenebiliriz.' },
      { from: 'boy', text: 'Beraber olduktan sonra\nher türlü eğleniriz zaten.' },
    ];
    this.runDialogue(lines, () => this.startDance());
  }

  runDialogue(lines, onComplete) {
    let idx = 0;

    const showNext = () => {
      this.clearUI();
      if (idx >= lines.length) {
        this.time.delayedCall(DIALOGUE_PRE_DELAY, onComplete);
        return;
      }

      const line = lines[idx];
      const isGirl = line.from === 'girl';
      const boxY = isGirl ? 350 : 310;
      const boxX = isGirl ? 210 : 590;
      const color = isGirl ? 0x6b4cff : 0x3a2040;
      const textX = boxX - 120;

      const bg = this.add.rectangle(boxX, boxY, 280, 70, color, 0.92).setDepth(20).setStrokeStyle(1, 0xff6688);
      const name = this.add.text(textX, boxY - 28, getSpeakerName(line.from), {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        color: isGirl ? '#ddd0ff' : '#ffbbbb',
        fontStyle: 'bold',
      }).setDepth(21);

      const txt = this.add.text(textX, boxY - 10, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        wordWrap: { width: 240 },
        lineSpacing: 4,
      }).setDepth(21);

      this.uiLayer.push(bg, name, txt);

      this.time.delayedCall(DIALOGUE_PRE_DELAY, () => {
        txt.setText(line.text);
        this.time.delayedCall(DIALOGUE_POST_DELAY, () => {
          const hint = this.add.text(400, 428, '[ Devam ]', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '14px',
            color: '#cc8899',
          }).setOrigin(0.5).setDepth(22).setAlpha(0).setInteractive({ useHandCursor: true });

          this.tweens.add({ targets: hint, alpha: 1, duration: 400 });

          hint.on('pointerdown', () => {
            hint.disableInteractive();
            idx++;
            this.time.delayedCall(DIALOGUE_PRE_DELAY, showNext);
          });

          this.uiLayer.push(hint);
        });
      });
    };

    showNext();
  }

  startMinigame() {
    this.clearUI();
    this.phase = 'minigame';
    this.round = 0;
    this.hintText = this.add.text(400, 24, 'Kaldırılan ellere dokun!', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#ffaaaa',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(20);
    this.uiLayer.push(this.hintText);
    this.nextRound();
  }

  nextRound() {
    if (this.round >= ROUNDS) {
      this.hintText?.destroy();
      this.showOutroDialogue();
      return;
    }

    this.crowd.forEach((c) => {
      c.raised = false;
      c.handProgress = 0;
      if (c.handTween) c.handTween.stop();
      this.drawHands(c.hands, 0, 0, 0, c.scale);
      c.hitZone.disableInteractive();
      c.hitZone.setFillStyle(0xff6688, 0);
      this.resumePersonCrowdMotion(c);
    });

    const available = this.crowd.filter((c) => c.canInteract && c.x > 120 && c.x < 680);
    const pick = Phaser.Utils.Array.GetRandom(available);

    this.time.delayedCall(500, () => {
      pick.raised = true;
      pick.hitZone.setPosition(pick.x, pick.y - 42 * pick.scale);
      pick.hitZone.setFillStyle(0xff6688, 0);
      pick.hitZone.disableInteractive();

      this.stopPersonCrowdMotion(pick);

      this.animateHandRaise(pick, () => {
        pick.hitZone.setFillStyle(0xff6688, 0.35);
        pick.hitZone.setInteractive({ useHandCursor: true });

        this.tweens.add({
          targets: pick.container,
          y: pick.container.y - 4,
          duration: 450,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      });

      if (this.hintText) {
        this.hintText.setText(`Ellere dokun! (${this.round + 1}/${ROUNDS})`);
      }
    });
  }

  onHandTapped(index) {
    if (this.isBusy || this.phase !== 'minigame') return;

    const person = this.crowd[index];
    if (!person?.raised) return;

    this.isBusy = true;
    person.raised = false;
    person.hitZone.disableInteractive();
    person.hitZone.setFillStyle(0xff6688, 0);
    this.stopPersonCrowdMotion(person);

    if (this.charIdleTween) this.charIdleTween.pause();

    this.animateHandLower(person, () => {
      this.resumePersonCrowdMotion(person);
      const targetX = person.x;
      const girlTarget = Phaser.Math.Clamp(targetX - 35, 80, 720);
      const boyTarget = Phaser.Math.Clamp(targetX + 15, 100, 740);

      this.tweens.add({
        targets: this.girl,
        x: girlTarget,
        y: this.charBaseY - 4,
        angle: -2,
        duration: WALK_MS,
        ease: 'Sine.easeInOut',
      });

      this.tweens.add({
        targets: this.boy,
        x: boyTarget,
        y: this.charBaseY - 4,
        angle: 2,
        duration: WALK_MS,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.round++;
          this.isBusy = false;
          if (this.charIdleTween) this.charIdleTween.resume();
          this.time.delayedCall(ROUND_GAP_MS, () => this.nextRound());
        },
      });
    });
  }

  startDance() {
    this.clearUI();
    this.phase = 'dance';

    this.add.text(400, 24, '♪ Dans ♪', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#ff8899',
    }).setOrigin(0.5).setDepth(20);

    if (this.charIdleTween) this.charIdleTween.stop();

    [this.girl, this.boy].forEach((char, i) => {
      this.tweens.add({
        targets: char,
        y: this.charBaseY - 10,
        angle: i === 0 ? -6 : 6,
        duration: 380,
        yoyo: true,
        repeat: 6,
        ease: 'Sine.easeInOut',
      });
    });

    this.crowd.forEach((person) => {
      this.tweens.add({
        targets: person.container,
        y: person.y - 8,
        angle: { from: -4, to: 4 },
        duration: 350,
        yoyo: true,
        repeat: 8,
        delay: person.swayOffset % 150,
      });
    });

    this.stageActors.forEach((actor) => {
      this.tweens.add({
        targets: actor,
        angle: { from: -5, to: 5 },
        duration: 400,
        yoyo: true,
        repeat: 8,
      });
    });

    this.time.delayedCall(4500, () => {
      this.cameras.main.fadeOut(1400, 0, 0, 0);
      this.time.delayedCall(1400, () => this.finishMemory());
    });
  }

  clearUI() {
    this.uiLayer.forEach((el) => el?.destroy());
    this.uiLayer = [];
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
