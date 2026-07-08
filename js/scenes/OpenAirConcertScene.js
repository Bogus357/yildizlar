import { bindSceneMusic, tryLoadMeyMp3, playRhythmHit, playCheerBurst, kickstartSceneAudio } from '../music.js';
import { getSpeakerName } from '../dialogueNames.js';

const CHAR_HEIGHT = 100;
const DANCE_INTRO_MS = 3500;
const LANE_Y = [288, 318, 348, 378];
const LANE_COLORS = [0xff5566, 0x55aaff, 0x55dd88, 0xffcc44];
const LANE_KEYS = ['D', 'F', 'J', 'K'];
const HIT_X = 136;
const NOTE_SPEED = 165;
const SPAWN_GAP_MS = 940;
const HIT_WINDOW = 42;

const LYRIC_WORDS = [
  'Ah,', 'ellerim', 'titriyor',
  "Of,", "bi'", 'ateş', 'basıyor',
  'Özlemek', 'bu,', 'dokunmakla', 'geçmiyor',
  'Ah,', 'öyle', 'sev', 'ki', 'beni',
  'Mey', 'diye', 'içeyim', 'Kalbim', 'tekliyor,',
  'ah,', 'gel,', 'hasta', 'gibiyim',
];

export class OpenAirConcertScene extends Phaser.Scene {
  constructor() {
    super('OpenAirConcertScene');
  }

  init(data) {
    this.starId = data.starId;
    this.phase = 'intro';
    this.uiLayer = [];
    this.activeNotes = [];
    this.noteIndex = 0;
    this.hits = 0;
    this.rhythmUI = null;
    this.danceTweens = [];
  }

  preload() {
    if (!this.textures.exists('girl')) this.load.image('girl', 'assets/girl.png');
    if (!this.textures.exists('boy')) this.load.image('boy', 'assets/boy.png');
  }

  create() {
    this.cameras.main.fadeIn(800, 0, 0, 0);
    bindSceneMusic(this, 'openAir');
    kickstartSceneAudio(this, 'openAir');
    tryLoadMeyMp3(this, () => kickstartSceneAudio(this, 'openAir'));

    this.createOutdoorVenue();
    this.createStageShow();
    this.createCrowd();
    this.createCharacters();
    this.startDancing();

    this.time.delayedCall(DANCE_INTRO_MS, () => this.showIntroDialogue());
  }

  createOutdoorVenue() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x1a1038, 0x1a1038, 0xff8844, 0x6622aa, 1);
    bg.fillRect(0, 0, 800, 450);

    bg.fillStyle(0xffaa66, 0.15);
    bg.fillCircle(620, 80, 70);

    const hills = this.add.graphics().setDepth(1);
    hills.fillStyle(0x120820, 0.85);
    hills.fillTriangle(0, 210, 200, 120, 400, 210);
    hills.fillTriangle(280, 210, 520, 100, 760, 210);
    hills.fillStyle(0x0a0610, 0.9);
    hills.fillRect(0, 200, 800, 80);
  }

  createStageShow() {
    const stageBack = this.add.graphics().setDepth(2);
    stageBack.fillStyle(0x080410, 1);
    stageBack.fillRect(180, 95, 440, 110);
    stageBack.fillStyle(0x140820, 1);
    stageBack.fillRect(200, 108, 400, 78);

    const screen = this.add.rectangle(400, 130, 320, 52, 0x220818, 0.9).setDepth(3);
    this.add.text(400, 130, '♪  ♪  ♪', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ff88aa',
    }).setOrigin(0.5).setDepth(4);

    this.tweens.add({
      targets: screen,
      alpha: { from: 0.7, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    for (let i = 0; i < 6; i++) {
      const x = 220 + i * 55;
      const beam = this.add.graphics().setDepth(2);
      beam.fillStyle([0xff4488, 0x44aaff, 0xffcc44][i % 3], 0.1);
      beam.fillTriangle(x, 95, x - 40, 210, x + 40, 210);
      this.tweens.add({
        targets: beam,
        alpha: { from: 0.4, to: 1 },
        duration: 800 + i * 100,
        yoyo: true,
        repeat: -1,
      });
    }

    this.createStagePerformer(360, 148);
    this.createStagePerformer(440, 148);
  }

  createStagePerformer(x, y) {
    const g = this.add.container(x, y).setDepth(5);
    g.add(this.add.ellipse(0, 10, 18, 30, 0x220818));
    g.add(this.add.circle(0, -12, 8, 0x220818));
    this.tweens.add({
      targets: g,
      y: y - 4,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  createCrowd() {
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(30, 770);
      const y = Phaser.Math.Between(215, 268);
      const s = Phaser.Math.FloatBetween(0.7, 1.1);
      const g = this.add.container(x, y).setDepth(6).setScale(s);
      g.add(this.add.ellipse(0, 0, 14, 24, 0x0a0610, 0.75));
      g.add(this.add.circle(0, -16, 6, 0x0a0610, 0.8));
      this.tweens.add({
        targets: g,
        y: y + Phaser.Math.Between(-6, 6),
        duration: Phaser.Math.Between(500, 900),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  createCharacters() {
    const baseY = 248;
    this.girl = this.add.sprite(360, baseY, 'girl');
    this.girl.setOrigin(0.5, 1);
    this.girl.setScale(CHAR_HEIGHT / this.girl.height);
    this.girl.setDepth(12);

    this.boy = this.add.sprite(440, baseY, 'boy');
    this.boy.setOrigin(0.5, 1);
    this.boy.setScale((CHAR_HEIGHT + 4) / this.boy.height);
    this.boy.setDepth(12);

    this.charBaseY = baseY;
  }

  startDancing() {
    this.danceTweens.forEach((t) => t?.stop());
    this.danceTweens = [];

    [this.girl, this.boy].forEach((char, i) => {
      const tw = this.tweens.add({
        targets: char,
        y: this.charBaseY - 8,
        angle: i === 0 ? 5 : -5,
        duration: 420 + i * 40,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.danceTweens.push(tw);
    });
  }

  stopDanceTweens() {
    this.danceTweens.forEach((t) => t?.stop());
    this.danceTweens = [];
    [this.girl, this.boy].forEach((char) => char.setAngle(0));
  }

  showIntroDialogue() {
    this.runDialogue(
      [
        { from: 'girl', text: 'Aaaa ben bu şarkıyı biliyorum, çok severim!' },
        { from: 'boy', text: 'Evet, gel beraber söyleyelim.' },
      ],
      () => this.startRhythmPhase()
    );
  }

  runDialogue(lines, onComplete) {
    let idx = 0;

    const showNext = () => {
      this.clearUI();
      if (idx >= lines.length) {
        this.time.delayedCall(600, onComplete);
        return;
      }

      const line = lines[idx];
      const isGirl = line.from === 'girl';
      const boxX = isGirl ? 210 : 590;
      const boxY = isGirl ? 200 : 168;

      const bg = this.add.rectangle(boxX, boxY, 300, 68, isGirl ? 0x6b4cff : 0x3a2040, 0.92)
        .setDepth(30).setStrokeStyle(1, 0x88aaff);
      const name = this.add.text(boxX - 130, boxY - 28, getSpeakerName(line.from), {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        color: isGirl ? '#ddd0ff' : '#ffbbbb',
        fontStyle: 'bold',
      }).setDepth(31);
      const txt = this.add.text(boxX - 130, boxY - 10, line.text, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        wordWrap: { width: 260 },
      }).setDepth(31);

      this.uiLayer.push(bg, name, txt);

      const hint = this.add.text(400, 248, '[ Devam ]', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#aaaacc',
      }).setOrigin(0.5).setDepth(32).setInteractive({ useHandCursor: true });

      hint.on('pointerdown', () => {
        hint.disableInteractive();
        idx++;
        showNext();
      });
      this.uiLayer.push(hint);
    };

    showNext();
  }

  startRhythmPhase() {
    this.clearUI();
    kickstartSceneAudio(this, 'openAir');
    playCheerBurst(this, 1);
    this.phase = 'rhythm';
    this.noteIndex = 0;
    this.hits = 0;
    this.activeNotes = [];

    this.createRhythmUI();
    this.setupRhythmInput();
    this.scheduleNextNote();
  }

  createRhythmUI() {
    const panel = this.add.rectangle(400, 340, 820, 168, 0x06040c, 0.88).setDepth(20);
    const title = this.add.text(400, 262, 'Kelime noktaya gelince soldaki renkli tuşa bas!', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px',
      color: '#ccddee',
    }).setOrigin(0.5).setDepth(21);

    const hitLine = this.add.rectangle(HIT_X, 333, 4, 130, 0xffffff, 0.85).setDepth(22);
    const hitGlow = this.add.circle(HIT_X, 333, 14, 0xffffff, 0.2).setDepth(22);

    this.tweens.add({
      targets: hitGlow,
      scale: { from: 0.9, to: 1.2 },
      alpha: { from: 0.15, to: 0.35 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    const laneLines = [];
    const laneButtons = [];

    LANE_Y.forEach((y, lane) => {
      const line = this.add.rectangle(400, y, 720, 2, 0x334466, 0.55).setDepth(21);
      laneLines.push(line);

      const btn = this.add.circle(52, y, 30, LANE_COLORS[lane], 0.95)
        .setDepth(23).setStrokeStyle(2, 0xffffff, 0.5).setInteractive({ useHandCursor: true });
      const keyLabel = this.add.text(52, y, `${lane + 1}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(24);

      btn.setData('lane', lane);
      btn.on('pointerdown', () => this.onLaneHit(lane, btn));

      laneButtons.push({ btn, keyLabel });
    });

    this.scoreText = this.add.text(680, 262, '0 / 0', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      color: '#aaccff',
    }).setOrigin(0.5).setDepth(21);

    this.rhythmUI = { panel, title, hitLine, hitGlow, laneLines, laneButtons };
    this.uiLayer.push(panel, title, hitLine, hitGlow, ...laneLines);
    laneButtons.forEach(({ btn, keyLabel }) => this.uiLayer.push(btn, keyLabel));
    this.uiLayer.push(this.scoreText);
  }

  setupRhythmInput() {
    this.rhythmKeys = this.input.keyboard.addKeys('D,F,J,K');
  }

  scheduleNextNote() {
    if (this.phase !== 'rhythm' || this.noteIndex >= LYRIC_WORDS.length) {
      if (this.activeNotes.length === 0 && this.noteIndex >= LYRIC_WORDS.length) {
        this.time.delayedCall(800, () => this.finishRhythm());
      }
      return;
    }

    const word = LYRIC_WORDS[this.noteIndex];
    const lane = this.noteIndex % 4;
    this.spawnNote(word, lane);
    this.noteIndex++;

    this.time.delayedCall(SPAWN_GAP_MS, () => this.scheduleNextNote());
  }

  spawnNote(word, lane) {
    const y = LANE_Y[lane];
    const color = LANE_COLORS[lane];
    const note = this.add.container(820, y).setDepth(25);
    const bg = this.add.rectangle(0, 0, Math.max(48, word.length * 9 + 24), 28, color, 0.35);
    bg.setStrokeStyle(1, color, 0.9);
    const txt = this.add.text(0, 0, word, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    note.add([bg, txt]);
    note.setData('lane', lane);
    note.setData('word', word);
    note.setData('hit', false);
    note.setData('missed', false);

    this.activeNotes.push(note);
    this.updateScoreText();
  }

  onLaneHit(lane, btn) {
    if (this.phase !== 'rhythm') return;

    if (btn) {
      this.tweens.add({
        targets: btn,
        scale: 1.25,
        duration: 80,
        yoyo: true,
      });
    }

    const note = this.activeNotes.find((n) => {
      if (n.getData('hit') || n.getData('missed')) return false;
      return n.getData('lane') === lane && Math.abs(n.x - HIT_X) <= HIT_WINDOW;
    });

    if (!note) return;

    note.setData('hit', true);
    this.hits++;
    playRhythmHit(this);
    this.updateScoreText();

    this.tweens.add({
      targets: note,
      alpha: 0,
      scale: 1.2,
      duration: 180,
      onComplete: () => {
        note.destroy();
        this.activeNotes = this.activeNotes.filter((n) => n.active);
        this.checkRhythmComplete();
      },
    });

    if (this.rhythmUI?.hitGlow) {
      this.tweens.add({
        targets: this.rhythmUI.hitGlow,
        alpha: 0.8,
        scale: 1.5,
        duration: 100,
        yoyo: true,
      });
    }
  }

  updateScoreText() {
    if (this.scoreText?.active) {
      this.scoreText.setText(`${this.hits} / ${LYRIC_WORDS.length}`);
    }
  }

  checkRhythmComplete() {
    if (this.noteIndex >= LYRIC_WORDS.length && this.activeNotes.length === 0) {
      this.time.delayedCall(600, () => this.finishRhythm());
    }
  }

  finishRhythm() {
    if (this.phase !== 'rhythm') return;
    playCheerBurst(this, 1.2);
    this.phase = 'outro';
    this.clearRhythmNotes();
    this.clearUI();
    this.showOutroDialogue();
  }

  showSpeechBox(from, text, onContinue) {
    this.clearUI();

    const isGirl = from === 'girl';
    const boxX = isGirl ? 210 : 590;
    const boxY = isGirl ? 200 : 168;

    const bg = this.add.rectangle(boxX, boxY, 300, 68, isGirl ? 0x6b4cff : 0x3a2040, 0.92)
      .setDepth(30).setStrokeStyle(1, 0x88aaff);
    const name = this.add.text(boxX - 130, boxY - 28, getSpeakerName(from), {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '11px',
      color: isGirl ? '#ddd0ff' : '#ffbbbb',
      fontStyle: 'bold',
    }).setDepth(31);
    const txt = this.add.text(boxX - 130, boxY - 10, text, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: isGirl && text.includes('EVET') ? '16px' : '14px',
      color: '#ffffff',
      wordWrap: { width: 260 },
      fontStyle: isGirl && text.includes('EVET') ? 'bold' : 'normal',
    }).setDepth(31);

    this.uiLayer.push(bg, name, txt);

    if (!onContinue) return;

    const hint = this.add.text(400, 248, '[ Devam ]', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      color: '#aaaacc',
    }).setOrigin(0.5).setDepth(32).setInteractive({ useHandCursor: true });

    hint.on('pointerdown', () => {
      kickstartSceneAudio(this, 'openAir');
      hint.disableInteractive();
      onContinue();
    });
    this.uiLayer.push(hint);
  }

  showOutroDialogue() {
    this.showSpeechBox('boy', 'Aleyna');

    this.time.delayedCall(2000, () => {
      this.showSpeechBox('boy', 'Benimle çıkar mısın?', () => {
        this.showSpeechBox('girl', 'EVETTTTTTTTT', () => {
          this.startDancing();
          this.time.delayedCall(3000, () => {
            this.cameras.main.fadeOut(1400, 0, 0, 0);
            this.time.delayedCall(1400, () => this.finishMemory());
          });
        });
      });
    });
  }

  clearRhythmNotes() {
    this.activeNotes.forEach((n) => n?.destroy());
    this.activeNotes = [];
  }

  update() {
    if (this.phase !== 'rhythm') return;

    const dt = this.game.loop.delta / 1000;

    LANE_KEYS.forEach((key, lane) => {
      if (Phaser.Input.Keyboard.JustDown(this.rhythmKeys[key])) {
        this.onLaneHit(lane, this.rhythmUI?.laneButtons?.[lane]?.btn);
      }
    });

    this.activeNotes.forEach((note) => {
      if (!note.active || note.getData('hit')) return;

      note.x -= NOTE_SPEED * dt;

      if (!note.getData('missed') && note.x < HIT_X - HIT_WINDOW) {
        note.setData('missed', true);
        this.tweens.add({
          targets: note,
          alpha: 0.3,
          duration: 200,
          onComplete: () => {
            note.destroy();
            this.activeNotes = this.activeNotes.filter((n) => n.active);
            this.checkRhythmComplete();
          },
        });
      }
    });
  }

  clearUI() {
    this.uiLayer.forEach((el) => el?.destroy());
    this.uiLayer = [];
    this.rhythmUI = null;
    this.scoreText = null;
  }

  finishMemory() {
    this.stopDanceTweens();
    const collected = this.registry.get('collectedStars') || [];
    if (!collected.includes(this.starId)) {
      collected.push(this.starId);
      this.registry.set('collectedStars', collected);
    }
    this.scene.start('SkyScene');
  }
}
