import { createDirectionPad, createActionButton } from '../mobileControls.js';
import { unlockSceneAudio, playSparkle } from '../music.js';

const WORLD = { width: 2200, height: 900 };
const PLAYER_HEIGHT = 92;
const SPAWN = { x: 180, y: WORLD.height * 0.72 };

const STARS = [
  { id: 0, x: 720, y: SPAWN.y - 70, memoryIndex: 0 },
  { id: 1, x: 1050, y: SPAWN.y - 35, memoryIndex: 1 },
  { id: 2, x: 1380, y: SPAWN.y - 85, memoryIndex: 2 },
  { id: 3, x: 1720, y: SPAWN.y - 45, memoryIndex: 3 },
  { id: 4, x: 2080, y: SPAWN.y - 60, memoryIndex: 4 },
];

export class SkyScene extends Phaser.Scene {
  constructor() {
    super('SkyScene');
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.collected = new Set(this.registry.get('collectedStars') || []);

    this.physics.world.setBounds(0, 80, WORLD.width, WORLD.height - 80);

    this.createBackground();
    this.createClouds();
    this.createFog();
    this.createPlayer();
    this.createStars();
    this.createUI();
    this.skyAudioReady = false;
    this.starWasLit = false;
    unlockSceneAudio(this);

    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.interactKeySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    if (this.registry.get('gameComplete')) {
      this.showGameCompleteMessage();
      return;
    }

    if (!this.registry.get('introSeen')) {
      this.showIntro();
      this.registry.set('introSeen', true);
    }
  }

  createBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x070818, 0x070818, 0x151845, 0x151845, 1);
    bg.fillRect(0, 0, WORLD.width, WORLD.height);

    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, WORLD.width);
      const y = Phaser.Math.Between(0, WORLD.height * 0.7);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.9);
      bg.fillStyle(0xffffff, alpha);
      bg.fillCircle(x, y, size);
    }
  }

  createClouds() {
    this.clouds = [];
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(100, WORLD.width - 100);
      const y = Phaser.Math.Between(120, WORLD.height - 150);
      const cloud = this.add.graphics({ x, y });
      const shade = Phaser.Math.Between(0x2a, 0x45);
      const color = (shade << 16) | (shade << 8) | (shade + 0x15);
      cloud.fillStyle(color, 0.35);
      cloud.fillEllipse(0, 0, Phaser.Math.Between(80, 160), Phaser.Math.Between(30, 55));
      cloud.fillEllipse(-30, 8, 70, 40);
      cloud.fillEllipse(35, 5, 80, 45);
      cloud.setDepth(1);
      this.clouds.push(cloud);
    }
  }

  createFog() {
    this.fogClouds = [];
    for (let i = 0; i < 55; i++) {
      const x = Phaser.Math.Between(0, WORLD.width);
      const y = Phaser.Math.Between(60, WORLD.height - 60);
      const radius = Phaser.Math.Between(50, 130);
      const baseAlpha = Phaser.Math.FloatBetween(0.45, 0.82);
      const gfx = this.add.graphics({ x, y });
      gfx.setDepth(5);
      this.fogClouds.push({ x, y, radius, baseAlpha, gfx });
      this.drawFogCloud(gfx, radius, baseAlpha);
    }
  }

  drawFogCloud(gfx, radius, alpha) {
    gfx.clear();
    gfx.fillStyle(0xb8c4e8, alpha);
    gfx.fillCircle(0, 0, radius);
    gfx.fillStyle(0x8899bb, alpha * 0.7);
    gfx.fillCircle(radius * 0.2, radius * 0.1, radius * 0.75);
  }

  createPlayer() {
    this.facingDir = 1;
    this.walkPhase = 0;
    this.playerBaseScale = 1;

    this.player = this.physics.add.sprite(SPAWN.x, SPAWN.y, 'girl');
    this.player.setOrigin(0.5, 1);
    this.playerBaseScale = PLAYER_HEIGHT / this.player.height;
    this.player.setScale(this.playerBaseScale);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(12);

    const bodyW = 24;
    const bodyH = 14;
    this.player.body.setSize(bodyW, bodyH);
    this.refreshPlayerBodyOffset();

    this.player.setDrag(800);
    this.player.setMaxVelocity(140);

    this.handLight = this.add.graphics();
    this.handLight.setDepth(11);

    this.lightGlow = this.add.graphics();
    this.lightGlow.setDepth(13);
    this.lightGlow.setBlendMode(Phaser.BlendModes.ADD);

    this.anims.create({
      key: 'girl-walk',
      frames: this.anims.generateFrameNumbers('girl_walk', { start: 0, end: 1 }),
      frameRate: 6,
      repeat: -1,
    });
  }

  refreshPlayerBodyOffset() {
    const bodyW = 24;
    const bodyH = 14;
    this.player.body.setOffset(
      this.player.displayWidth / 2 - bodyW / 2,
      this.player.displayHeight - bodyH
    );
  }

  getNextStarData() {
    const nextIndex = this.collected.size;
    if (nextIndex >= STARS.length) return null;
    return STARS[nextIndex];
  }

  createStars() {
    this.starObjects = [];

    const starData = this.getNextStarData();
    if (!starData) return;

    const container = this.add.container(starData.x, starData.y);
    container.setDepth(25);
    container.setSize(90, 90);

    const glow = this.add.graphics();
    glow.fillStyle(0xffeeaa, 0.15);
    glow.fillCircle(0, 0, 60);
    glow.fillStyle(0xffffcc, 0.25);
    glow.fillCircle(0, 0, 30);

    const core = this.add.graphics();
    core.fillStyle(0xffffff, 1);
    this.drawStarShape(core, 0, 0, 14, 6, 5);

    container.add([glow, core]);
    container.setData('glow', glow);
    container.setData('core', core);
    container.setData('starData', starData);
    container.setAlpha(0);

    container.setInteractive(
      new Phaser.Geom.Circle(0, 0, 50),
      Phaser.Geom.Circle.Contains
    );
    container.input.cursor = 'pointer';
    container.on('pointerdown', () => this.tryOpenStar(container));

    this.starObjects.push(container);

    this.refreshActiveStar();
  }

  refreshActiveStar() {
    this.activeStar = this.getNearestStar() || null;
  }

  getNearestStar() {
    let nearest = null;
    let best = Infinity;
    this.starObjects.forEach((star) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, star.x, star.y);
      if (d < best) {
        best = d;
        nearest = star;
      }
    });
    return nearest;
  }

  tryOpenStar(starContainer = null) {
    const star = starContainer || this.getNearestStar();
    if (!star || !this.isStarInLight(star)) return;

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, star.x, star.y);
    if (dist > 100) return;

    const starData = star.getData('starData');
    if (starData.memoryIndex !== this.collected.size) return;

    const payload = { starId: starData.id, memoryIndex: starData.memoryIndex };

    if (starData.memoryIndex === 0) {
      this.scene.start('PhoneChatScene', payload);
    } else if (starData.memoryIndex === 1) {
      this.scene.start('ConcertScene', payload);
    } else if (starData.memoryIndex === 2) {
      this.scene.start('MeyhaneScene', payload);
    } else if (starData.memoryIndex === 3) {
      this.scene.start('OpenAirConcertScene', payload);
    } else if (starData.memoryIndex === 4) {
      this.scene.start('FinaleScene', payload);
    } else {
      this.scene.start('MemoryScene', payload);
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

  addCollectedStar(x, y) {
    const star = this.add.graphics({ x, y });
    star.setDepth(3);
    star.fillStyle(0xffeeaa, 0.6);
    this.drawStarShape(star, 0, 0, 10, 4, 5);
  }

  createUI() {
    this.hintText = this.add
      .text(16, 16, 'Sıradaki yıldızı ara ve dokun\nHer anı seni ileriye taşır', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#c8d4ff',
        backgroundColor: '#00000066',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.interactHint = this.add
      .text(400, 400, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#fff8cc',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    this.progressText = this.add
      .text(784, 16, `${this.collected.size}/5`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#ffeeaa',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(20);

    this.add
      .text(400, 432, 'Telefon/tablet: sol pad ile yürü, sağ alttan dokun', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        color: '#666688',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20);

    this.touchDpad = createDirectionPad(this);
    this.touchAction = createActionButton(this, {
      x: 710,
      y: 385,
      w: 104,
      h: 46,
      label: '✦ Dokun',
      onPress: () => this.tryTouchInteract(),
    });
    this.touchAction.setVisible(false);
  }

  tryTouchInteract() {
    const star = this.getNearestStar();
    if (!star || !this.isStarInLight(star)) return;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, star.x, star.y);
    if (dist < 100) this.tryOpenStar(star);
  }

  showGameCompleteMessage() {
    this.player.setVisible(false);
    this.add.rectangle(400, 225, 800, 450, 0x070818).setScrollFactor(0).setDepth(50);
    this.add.text(400, 210, 'Seni seviyorum ♥', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '28px',
      color: '#ffe8cc',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.add.text(400, 260, 'Tüm yıldızlar toplandı.', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '15px',
      color: '#aabbdd',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
  }

  showIntro() {
    const overlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.75).setScrollFactor(0).setDepth(30);
    const text = this.add
      .text(
        400,
        200,
        'Sisli bir gecede yıldızlar seni çağırıyor...\n\nSol alttaki oklarla yürü.\nYıldıza yaklaşınca sağ alttan dokun.',
        {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '18px',
          color: '#e8eeff',
          align: 'center',
          lineSpacing: 8,
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(31);

    const btn = this.add
      .text(400, 310, '[ Başla ]', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#ffeeaa',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(31)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      overlay.destroy();
      text.destroy();
      btn.destroy();
      this.registry.set('introSeen', true);
      if (this.sound.context?.state === 'suspended') {
        this.sound.context.resume();
      }
      this.sound.unlock();
    });
  }

  update() {
    if (this.registry.get('gameComplete')) return;

    this.handleMovement();
    this.updateWalkAnimation();
    this.refreshActiveStar();
    this.updateFogAndLight();
    this.updateActiveStars();
    this.handleInteraction();
  }

  updateWalkAnimation() {
    const { x: vx, y: vy } = this.player.body.velocity;
    const moving = Math.abs(vx) > 8 || Math.abs(vy) > 8;
    const base = this.playerBaseScale;

    if (moving) {
      if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== 'girl-walk') {
        this.player.play('girl-walk');
      }
      this.walkPhase += 0.22;
      const step = Math.sin(this.walkPhase);
      this.player.setScale(base * (1 + step * 0.012), base * (1 - Math.abs(step) * 0.02));
      this.player.setAngle(step * 1.2 * this.facingDir);
    } else {
      this.player.anims.stop();
      this.player.setTexture('girl');
      this.walkPhase = 0;
      this.player.setScale(
        Phaser.Math.Linear(this.player.scaleX, base, 0.25),
        Phaser.Math.Linear(this.player.scaleY, base, 0.25)
      );
      this.player.setAngle(Phaser.Math.Linear(this.player.angle, 0, 0.25));
    }

    this.refreshPlayerBodyOffset();
  }

  handleMovement() {
    const speed = 140;
    let vx = 0;
    let vy = 0;

    const touchVel = this.touchDpad.getVelocity(speed);
    if (touchVel.vx || touchVel.vy) {
      vx = touchVel.vx;
      vy = touchVel.vy;
    } else {
      if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
      else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;

      if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed;
      else if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed;
    }

    this.player.setVelocity(vx, vy);

    if ((vx || vy) && !this.skyAudioReady) {
      this.skyAudioReady = true;
      if (this.sound.context?.state === 'suspended') {
        this.sound.context.resume();
      }
      this.sound.unlock();
    }

    if (vx < 0) this.facingDir = -1;
    else if (vx > 0) this.facingDir = 1;
  }

  getLightCenter() {
    return {
      x: this.player.x,
      y: this.player.y - this.player.displayHeight * 0.5,
    };
  }

  getLightRadius(star = this.activeStar) {
    const proximity = this.getStarProximity(star);
    return 85 + proximity * 115;
  }

  getStarDistance(star = this.activeStar) {
    if (!star) return Infinity;
    const light = this.getLightCenter();
    return Phaser.Math.Distance.Between(light.x, light.y, star.x, star.y);
  }

  isStarInLight(star = this.activeStar) {
    if (!star) return false;
    return this.getStarDistance(star) <= this.getLightRadius(star);
  }

  getStarProximity(star = this.activeStar) {
    if (!star) return 0;
    const maxDist = 900;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, star.x, star.y);
    return Phaser.Math.Clamp(1 - dist / maxDist, 0, 1);
  }

  updateFogAndLight() {
    const proximity = this.getStarProximity();
    const lightRadius = this.getLightRadius();

    this.fogClouds.forEach((cloud) => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, cloud.x, cloud.y);
      let alpha = cloud.baseAlpha;
      if (dist < lightRadius + cloud.radius) {
        const t = dist / (lightRadius + cloud.radius);
        alpha = Phaser.Math.Linear(0.05, cloud.baseAlpha, t);
      }
      this.drawFogCloud(cloud.gfx, cloud.radius, alpha);
    });

    const facing = this.facingDir;
    const lampX = this.player.x + facing * 14;
    const lampY = this.player.y - this.player.displayHeight * 0.55;

    this.handLight.clear();
    const lampAlpha = 0.25 + proximity * 0.45;
    const lampRadius = 18 + proximity * 14;
    this.handLight.fillStyle(0xffdd88, lampAlpha);
    this.handLight.fillCircle(lampX, lampY, lampRadius);

    this.lightGlow.clear();
    const glowAlpha = 0.04 + proximity * 0.1;
    const light = this.getLightCenter();
    this.lightGlow.fillStyle(0xaaccff, glowAlpha);
    this.lightGlow.fillCircle(light.x, light.y, lightRadius);
    this.lightGlow.fillStyle(0xffeecc, glowAlpha * 0.6);
    this.lightGlow.fillCircle(lampX, lampY, lightRadius * 0.45);
  }

  updateActiveStars() {
    this.starObjects.forEach((star) => {
      const starDist = this.getStarDistance(star);
      const lightRadius = this.getLightRadius(star);
      const inLight = starDist <= lightRadius;

      if (!inLight) {
        star.setAlpha(0);
        if (star === this.activeStar) {
          this.starWasLit = false;
        }
        return;
      }

      if (star === this.activeStar && !this.starWasLit) {
        this.starWasLit = true;
        playSparkle(this);
      }

      const innerGlow = 1 - starDist / lightRadius;
      const proximity = this.getStarProximity(star);
      const glow = star.getData('glow');
      const core = star.getData('core');

      star.setAlpha(Phaser.Math.Clamp(innerGlow * 1.4, 0.15, 1));

      glow.clear();
      const outerR = 20 + innerGlow * 70 + proximity * 20;
      const innerR = 10 + innerGlow * 35 + proximity * 10;
      glow.fillStyle(0xffeeaa, 0.08 + innerGlow * 0.35);
      glow.fillCircle(0, 0, outerR);
      glow.fillStyle(0xffffcc, 0.15 + innerGlow * 0.45);
      glow.fillCircle(0, 0, innerR);

      core.clear();
      core.fillStyle(0xffffff, 0.45 + innerGlow * 0.55);
      this.drawStarShape(core, 0, 0, 8 + innerGlow * 12, 3 + innerGlow * 5, 5);

      star.setScale(0.85 + innerGlow * 0.25);
    });
  }

  handleInteraction() {
    const star = this.getNearestStar();
    if (!star || !this.isStarInLight(star)) {
      this.interactHint.setVisible(false);
      this.touchAction?.setVisible(false);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, star.x, star.y);

    if (dist < 100) {
      this.interactHint.setText('Yıldıza dokun ✦');
      this.interactHint.setVisible(true);
      this.touchAction?.setVisible(true);

      if (
        Phaser.Input.Keyboard.JustDown(this.interactKey) ||
        Phaser.Input.Keyboard.JustDown(this.interactKeySpace)
      ) {
        this.tryOpenStar(star);
      }
    } else {
      this.interactHint.setVisible(false);
      this.touchAction?.setVisible(false);
    }
  }

  preload() {
    this.load.image('girl', 'assets/girl.png');
    this.load.image('boy', 'assets/boy.png');
    this.load.spritesheet('girl_walk', 'assets/girl_walk.png', {
      frameWidth: 273,
      frameHeight: 958,
    });
  }
}
