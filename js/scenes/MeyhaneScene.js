import { createPlatformControls } from '../mobileControls.js';
import { bindSceneMusic, playDefHit, kickstartSceneAudio } from '../music.js';
import { getSpeakerName } from '../dialogueNames.js';

const CHAR_HEIGHT = 112;
const DRINK_ROUNDS = 5;
const CIGAR_GOAL = 7;
const CIGAR_SPAWN_DELAY = 450;
const DIALOGUE_START_DELAY = 3000;
const DIALOGUE_LINE_DELAY = 1200;

export class MeyhaneScene extends Phaser.Scene {
  constructor() {
    super('MeyhaneScene');
  }

  init(data) {
    this.starId = data.starId;
    this.phase = 'intro';
    this.drinkRound = 0;
    this.cigarsCollected = 0;
    this.uiLayer = [];
    this.tables = [];
    this.cigars = [];
    this.dancers = [];
    this.isDrinking = false;
    this.cigarItems = [];
    this.activeCigar = null;
    this.girlVY = 0;
    this.girlOnGround = false;
  }

  preload() {
    if (!this.textures.exists('girl')) this.load.image('girl', 'assets/girl.png');
    if (!this.textures.exists('boy')) this.load.image('boy', 'assets/boy.png');
  }

  create() {
    this.cameras.main.fadeIn(800, 0, 0, 0);
    bindSceneMusic(this, 'meyhane');
    kickstartSceneAudio(this, 'meyhane');

    this.physics.world.gravity.y = 0;

    this.createTavern();
    this.createTables();
    this.createCrowd();
    this.createBellyDancer();
    this.createCharacters();
    this.showIntroDialogue();
  }

  createTavern() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x080612, 0x080612, 0x120820, 0x0a0610, 1);
    bg.fillRect(0, 0, 800, 450);

    const colors = [0x8844ff, 0x2288ff, 0x22cc66];
    colors.forEach((color, i) => {
      const x = 150 + i * 250;
      const light = this.add.graphics().setDepth(1);
      light.fillStyle(color, 0.12);
      light.fillTriangle(x, 0, x - 100, 320, x + 100, 320);
      this.tweens.add({
        targets: light,
        alpha: { from: 0.6, to: 1 },
        duration: 900 + i * 200,
        yoyo: true,
        repeat: -1,
      });
    });

    this.add.rectangle(400, 430, 840, 50, 0x050308, 0.8).setDepth(2);
  }

  createTables() {
    const layouts = [
      { x: 120, y: 340, w: 90 },
      { x: 260, y: 355, w: 85 },
      { x: 400, y: 330, w: 100 },
      { x: 540, y: 350, w: 88 },
      { x: 680, y: 338, w: 92 },
    ];

    layouts.forEach((t, i) => {
      const table = this.add.container(t.x, t.y).setDepth(4);
      const top = this.add.rectangle(0, 0, t.w, 12, 0x4a3020);
      const legL = this.add.rectangle(-t.w * 0.35, 18, 8, 28, 0x3a2518);
      const legR = this.add.rectangle(t.w * 0.35, 18, 8, 28, 0x3a2518);
      const cloth = this.add.rectangle(0, -2, t.w + 8, 16, 0x5a2838, 0.7);
      const bottle = this.add.rectangle(-15, -14, 8, 18, 0xeeddcc, 0.8);
      table.add([legL, legR, top, cloth, bottle]);

      this.tables.push({
        container: table,
        x: t.x,
        y: t.y,
        w: t.w,
        baseY: t.y,
        floatOffset: i * 0.7,
        surfaceOffset: -6,
      });
    });
  }

  createCrowd() {
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(40, 760);
      const y = Phaser.Math.Between(250, 390);
      const g = this.add.container(x, y).setDepth(5);
      g.add(this.add.ellipse(0, 0, 22, 38, 0x0c0810, 0.85));
      g.add(this.add.circle(0, -24, 9, 0x0c0810, 0.9));

      this.dancers.push(g);
      this.startDancerMotion(g, x, y);
    }
  }

  startDancerMotion(g, baseX, baseY) {
    const drift = () => {
      if (!g.active || this.phase === 'platform') return;
      this.tweens.add({
        targets: g,
        x: baseX + Phaser.Math.Between(-14, 14),
        y: baseY + Phaser.Math.Between(-10, 10),
        angle: Phaser.Math.Between(-5, 5),
        duration: Phaser.Math.Between(400, 800),
        ease: 'Sine.easeInOut',
        onComplete: drift,
      });
    };
    drift();
  }

  createBellyDancer() {
    const table = this.tables[2];
    const y = -55;

    this.bellyDancer = this.add.container(0, y).setDepth(8);
    const body = this.add.ellipse(0, 10, 26, 34, 0x661144);
    const head = this.add.circle(0, -16, 9, 0x552233);
    const scarf = this.add.ellipse(0, 0, 40, 12, 0xff4488, 0.5);
    this.bellyDancer.add([body, head, scarf]);
    table.container.add(this.bellyDancer);

    this.tweens.add({
      targets: this.bellyDancer,
      x: 8,
      angle: { from: -6, to: 6 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    this.tweens.add({
      targets: scarf,
      scaleX: { from: 0.9, to: 1.15 },
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
  }

  createCharacters() {
    const baseY = 410;
    this.girl = this.physics.add.sprite(340, baseY, 'girl');
    this.girl.setOrigin(0.5, 1);
    this.girl.setScale(CHAR_HEIGHT / this.girl.height);
    this.girl.setDepth(12);
    this.girl.body.setAllowGravity(false);
    this.girl.body.setSize(32, 16);
    this.girl.body.setOffset(
      this.girl.displayWidth / 2 - 16,
      this.girl.displayHeight - 16
    );

    this.boy = this.add.sprite(430, baseY, 'boy');
    this.boy.setOrigin(0.5, 1);
    this.boy.setScale((CHAR_HEIGHT + 6) / this.boy.height);
    this.boy.setDepth(12);

    this.charBaseY = baseY;
    this.girlGlass = this.add.rectangle(0, 0, 10, 16, 0xeeddcc).setDepth(13).setVisible(false);
    this.boyGlass = this.add.rectangle(0, 0, 10, 16, 0xeeddcc).setDepth(13).setVisible(false);
  }

  showIntroDialogue() {
    this.time.delayedCall(DIALOGUE_START_DELAY, () => {
      this.runDialogue(
        [
          { from: 'boy', text: 'Güzel mekanmış.' },
          { from: 'girl', text: 'Evet, çok beğendimmm!' },
          { from: 'boy', text: 'Ben dans etmem, sarhoş da olmam.' },
          { from: 'girl', text: 'Yok ya öyle şeyler yapmayız.' },
        ],
        () => this.startDrinkingPhase()
      );
    });
  }

  runDialogue(lines, onComplete) {
    let idx = 0;

    const showNext = () => {
      this.clearUI();
      if (idx >= lines.length) {
        this.time.delayedCall(800, onComplete);
        return;
      }

      const line = lines[idx];
      const isGirl = line.from === 'girl';
      const boxX = isGirl ? 210 : 590;
      const boxY = isGirl ? 350 : 310;

      const bg = this.add.rectangle(boxX, boxY, 290, 72, isGirl ? 0x6b4cff : 0x3a2040, 0.92)
        .setDepth(20).setStrokeStyle(1, 0x88aaff);
      const name = this.add.text(boxX - 125, boxY - 30, getSpeakerName(line.from), {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        color: isGirl ? '#ddd0ff' : '#ffbbbb',
        fontStyle: 'bold',
      }).setDepth(21);
      const txt = this.add.text(boxX - 125, boxY - 12, line.text, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        wordWrap: { width: 250 },
      }).setDepth(21);

      this.uiLayer.push(bg, name, txt);

      this.time.delayedCall(DIALOGUE_LINE_DELAY, () => {
        const hint = this.add.text(400, 428, '[ Devam ]', {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '14px',
          color: '#aaaacc',
        }).setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });

        hint.on('pointerdown', () => {
          kickstartSceneAudio(this, 'meyhane');
          hint.disableInteractive();
          idx++;
          showNext();
        });
        this.uiLayer.push(hint);
      });
    };

    showNext();
  }

  startDrinkingPhase() {
    this.clearUI();
    kickstartSceneAudio(this, 'meyhane');
    playDefHit(this, 'dum');
    this.phase = 'drink';
    this.drinkRound = 0;
    this.showDrinkButton();
  }

  showDrinkButton() {
    if (this.drinkRound >= DRINK_ROUNDS) {
      this.phase = 'transition';
      const msg = this.add.text(400, 400, 'Masalar uçmaya başladı...', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '15px',
        color: '#ccddff',
      }).setOrigin(0.5).setDepth(20);

      this.time.delayedCall(1200, () => {
        msg.destroy();
        try {
          this.startPlatformPhase();
        } catch (err) {
          console.error(err);
          this.add.text(400, 225, 'Platform hatası — sayfayı yenile', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '14px',
            color: '#ff8888',
            align: 'center',
          }).setOrigin(0.5).setDepth(40);
        }
      });
      return;
    }

    const btn = this.add.rectangle(400, 400, 180, 44, 0x44aa88, 0.95)
      .setDepth(20).setStrokeStyle(1, 0x88ffcc).setInteractive({ useHandCursor: true });
    const label = this.add.text(400, 400, `🥛  Rakı iç (${this.drinkRound + 1}/${DRINK_ROUNDS})`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(21);

    btn.on('pointerdown', () => {
      if (this.isDrinking) return;
      kickstartSceneAudio(this, 'meyhane');
      playDefHit(this, 'glass');
      this.isDrinking = true;
      btn.disableInteractive();
      btn.destroy();
      label.destroy();
      this.playDrinkAnimation(() => {
        this.isDrinking = false;
        playDefHit(this, 'dum');
        this.drinkRound++;
        this.time.delayedCall(400, () => this.showDrinkButton());
      });
    });
  }

  playDrinkAnimation(onComplete) {
    const targets = [
      { char: this.girl, glass: this.girlGlass, xOff: 18, yOff: -75 },
      { char: this.boy, glass: this.boyGlass, xOff: -16, yOff: -78 },
    ];

    targets.forEach(({ char, glass, xOff, yOff }) => {
      const baseX = char.x + xOff;
      const baseY = char.y + yOff;
      glass.setVisible(true);
      glass.setPosition(baseX, baseY + 20);

      this.tweens.add({
        targets: glass,
        y: baseY - 25,
        duration: 900,
        ease: 'Sine.easeOut',
        yoyo: true,
        onComplete: () => glass.setVisible(false),
      });

      this.tweens.add({
        targets: char,
        angle: xOff > 0 ? 4 : -4,
        duration: 900,
        yoyo: true,
        onComplete: () => { char.setAngle(0); },
      });
    });

    this.time.delayedCall(2000, onComplete);
  }

  getTableSurfaceY(table) {
    return table.container.y + table.surfaceOffset;
  }

  refreshPlatformStart() {
    const startTable = this.tables[2];
    this.platformStart = {
      x: startTable.x,
      y: this.getTableSurfaceY(startTable),
    };
  }

  getFallLineY() {
    const lowestSurface = Math.max(...this.tables.map((t) => this.getTableSurfaceY(t)));
    return lowestSurface + 30;
  }

  respawnGirlAtStart() {
    this.refreshPlatformStart();
    this.placeGirlOnPlatform(this.platformStart.x, this.platformStart.y);
  }

  placeGirlOnPlatform(x, surfaceY) {
    this.girl.setPosition(x, surfaceY);
    this.girl.body.reset(x, surfaceY);
    this.girl.setVelocity(0, 0);
    this.girlVY = 0;
    this.girlOnGround = true;
  }

  startPlatformPhase() {
    if (this.phase === 'platform' || this.phase === 'done') return;

    this.clearUI();
    this.phase = 'platform';

    this.dancers.forEach((d) => this.tweens.killTweensOf(d));

    this.physics.world.gravity.y = 0;

    this.hintText = this.add.text(400, 22, 'Masalar uçuyor! Puroları topla (0/7)', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#ccddff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(30);

    this.boy.setVisible(false);

    this.tables.forEach((table, i) => {
      this.tweens.add({
        targets: table.container,
        y: `-=${14 + i * 2}`,
        duration: 900 + i * 80,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    });

    this.refreshPlatformStart();
    this.girl.setDepth(15);
    this.girl.body.setAllowGravity(false);
    this.placeGirlOnPlatform(this.platformStart.x, this.platformStart.y);

    this.spawnCigars();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    this.jumpKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.add.text(400, 44, 'Sol oklar — yürü  |  Sağ ↑ — zıpla', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '11px',
      color: '#8899aa',
    }).setOrigin(0.5).setDepth(30);

    this.platformTouch = createPlatformControls(this, {
      onJump: () => {
        if (!this.girlOnGround) return;
        this.girlVY = -300;
        this.girlOnGround = false;
      },
    });
  }

  getRandomCigarSpot() {
    if (Phaser.Math.Between(0, 100) < 55) {
      const table = Phaser.Utils.Array.GetRandom(this.tables);
      return {
        x: Phaser.Math.Clamp(table.x + Phaser.Math.Between(-24, 24), 60, 740),
        y: this.getTableSurfaceY(table) - Phaser.Math.Between(32, 68),
      };
    }

    return {
      x: Phaser.Math.Between(70, 730),
      y: Phaser.Math.Between(220, 340),
    };
  }

  spawnCigarAt(spot) {
    const cigar = this.add.container(spot.x, spot.y).setDepth(9).setScale(0);
    cigar.add(this.add.rectangle(0, 0, 24, 10, 0x8b5a2b));
    cigar.add(this.add.circle(9, 0, 3, 0xff6622));
    cigar.add(this.add.circle(0, 0, 16, 0xffaa44, 0.18));
    cigar.setData('collected', false);

    this.tweens.add({
      targets: cigar,
      scale: 1,
      duration: 280,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: cigar,
      y: spot.y - 6,
      duration: Phaser.Math.Between(650, 900),
      yoyo: true,
      repeat: -1,
    });

    return cigar;
  }

  spawnNextCigar() {
    if (this.phase !== 'platform' || this.cigarsCollected >= CIGAR_GOAL) return;
    if (this.activeCigar?.active) return;

    const spot = this.getRandomCigarSpot();
    this.activeCigar = this.spawnCigarAt(spot);
    this.cigarItems = [this.activeCigar];
  }

  spawnCigars() {
    this.cigarItems = [];
    this.activeCigar = null;
    this.spawnNextCigar();
  }

  tryCollectCigars() {
    if (!this.cigarItems?.length) return;

    const hitX = this.girl.x;
    const hitY = this.girl.y - this.girl.displayHeight * 0.45;
    const hitW = 42;
    const hitH = 56;

    this.cigarItems.forEach((cigar) => {
      if (!cigar?.active || cigar.getData('collected')) return;
      const dx = Math.abs(hitX - cigar.x);
      const dy = Math.abs(hitY - cigar.y);
      if (dx < hitW && dy < hitH) {
        this.collectCigar(cigar);
      }
    });
  }

  collectCigar(cigar) {
    if (!cigar?.active || cigar.getData('collected')) return;
    playDefHit(this, 'tek');
    cigar.setData('collected', true);
    cigar.destroy();
    this.activeCigar = null;
    this.cigarItems = [];
    this.cigarsCollected++;

    if (this.hintText?.active) {
      this.hintText.setText(`Masalar uçuyor! Puroları topla (${this.cigarsCollected}/${CIGAR_GOAL})`);
    }

    if (this.cigarsCollected >= CIGAR_GOAL) {
      this.finishPlatform();
      return;
    }

    this.time.delayedCall(CIGAR_SPAWN_DELAY, () => this.spawnNextCigar());
  }

  finishPlatform() {
    this.phase = 'done';
    this.platformTouch?.destroy();
    this.platformTouch = null;
    this.hintText?.setText('Tamamdır!');

    this.time.delayedCall(1200, () => {
      this.cameras.main.fadeOut(1400, 0, 0, 0);
      this.time.delayedCall(1400, () => this.finishMemory());
    });
  }

  getSupportingTable(x, y, yMargin = 18) {
    for (const table of this.tables) {
      const surfaceY = this.getTableSurfaceY(table);
      const halfW = table.w / 2 - 6;
      if (x >= table.x - halfW && x <= table.x + halfW && Math.abs(y - surfaceY) <= yMargin) {
        return table;
      }
    }
    return null;
  }

  isJumpPressed() {
    return (
      Phaser.Input.Keyboard.JustDown(this.jumpKeys.space) ||
      Phaser.Input.Keyboard.JustDown(this.jumpKeys.up) ||
      Phaser.Input.Keyboard.JustDown(this.jumpKeys.w) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up)
    );
  }

  updatePlatformMovement() {
    const dt = this.game.loop.delta / 1000;
    const gravity = 680;
    const speed = 170;
    const fallLineY = this.getFallLineY();

    let vx = 0;
    if (this.platformTouch?.state?.left) vx = -speed;
    else if (this.platformTouch?.state?.right) vx = speed;
    else if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;

    let x = this.girl.x + vx * dt;
    x = Phaser.Math.Clamp(x, 24, 776);

    const supportedTable = this.getSupportingTable(this.girl.x, this.girl.y);
    const canJump = this.girlOnGround || supportedTable !== null;

    if (canJump && this.isJumpPressed()) {
      this.girlVY = -300;
      this.girlOnGround = false;
    }

    if (!this.girlOnGround) {
      this.girlVY = Math.min(this.girlVY + gravity * dt, 380);
    }

    let y = this.girl.y + this.girlVY * dt;
    this.girlOnGround = false;

    for (const table of this.tables) {
      const surfaceY = this.getTableSurfaceY(table);
      const halfW = table.w / 2 - 6;
      if (x < table.x - halfW || x > table.x + halfW) continue;

      if (this.girlVY >= 0 && this.girl.y <= surfaceY + 16 && y >= surfaceY - 2) {
        y = surfaceY;
        this.girlVY = 0;
        this.girlOnGround = true;
      }
    }

    const tableUnderFeet = this.getSupportingTable(x, y);
    if (tableUnderFeet && this.girlVY >= 0) {
      y = this.getTableSurfaceY(tableUnderFeet);
      this.girlVY = 0;
      this.girlOnGround = true;
    } else if (this.girlVY >= 0 && !tableUnderFeet && y < fallLineY) {
      this.girlOnGround = false;
      if (this.girlVY === 0) this.girlVY = 80;
    }

    if (y > fallLineY) {
      this.respawnGirlAtStart();
      return;
    }

    this.girl.setPosition(x, y);
    this.girl.body.reset(x, y);
  }

  update() {
    if (this.phase !== 'platform' || !this.girl?.body || !this.cursors || !this.jumpKeys) return;

    this.updatePlatformMovement();
    this.tryCollectCigars();
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
