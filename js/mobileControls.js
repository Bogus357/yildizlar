export function isTouchDevice() {
  return (
    ('ontouchstart' in window) ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export function createDirectionPad(scene, config = {}) {
  const {
    x = 88,
    y = 380,
    depth = 200,
    scrollFactor = 0,
    size = 46,
  } = config;

  const pad = { up: false, down: false, left: false, right: false };
  const objects = [];
  const half = size / 2;

  const makeBtn = (bx, by, dir, label) => {
    const btn = scene.add.circle(x + bx, y + by, half, 0x223355, 0.78)
      .setScrollFactor(scrollFactor)
      .setDepth(depth)
      .setStrokeStyle(2, 0x88aacc, 0.85)
      .setInteractive({ useHandCursor: true });

    const txt = scene.add.text(x + bx, y + by, label, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '15px',
      color: '#ddeeff',
    }).setOrigin(0.5).setScrollFactor(scrollFactor).setDepth(depth + 1);

    const on = () => {
      pad[dir] = true;
      btn.setFillStyle(0x446688, 0.95);
    };
    const off = () => {
      pad[dir] = false;
      btn.setFillStyle(0x223355, 0.78);
    };

    btn.on('pointerdown', on);
    btn.on('pointerup', off);
    btn.on('pointerout', off);
    btn.on('pointerupoutside', off);

    objects.push(btn, txt);
  };

  makeBtn(0, -size - 2, 'up', '▲');
  makeBtn(0, size + 2, 'down', '▼');
  makeBtn(-size - 2, 0, 'left', '◀');
  makeBtn(size + 2, 0, 'right', '▶');

  return {
    getVelocity(speed) {
      let vx = 0;
      let vy = 0;
      if (pad.left) vx -= speed;
      else if (pad.right) vx += speed;
      if (pad.up) vy -= speed;
      else if (pad.down) vy += speed;
      return { vx, vy };
    },
    destroy() {
      objects.forEach((obj) => obj?.destroy());
    },
    setVisible(visible) {
      objects.forEach((obj) => obj?.setVisible(visible));
    },
  };
}

export function createActionButton(scene, config) {
  const {
    x,
    y,
    w,
    h,
    label,
    depth = 200,
    scrollFactor = 0,
    onPress,
  } = config;

  const btn = scene.add.rectangle(x, y, w, h, 0x446688, 0.88)
    .setScrollFactor(scrollFactor)
    .setDepth(depth)
    .setStrokeStyle(2, 0xaaccff, 0.9)
    .setInteractive({ useHandCursor: true });

  const txt = scene.add.text(x, y, label, {
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: '13px',
    color: '#ffffff',
  }).setOrigin(0.5).setScrollFactor(scrollFactor).setDepth(depth + 1);

  btn.on('pointerdown', () => onPress?.());

  return {
    button: btn,
    label: txt,
    setVisible(visible) {
      btn.setVisible(visible);
      txt.setVisible(visible);
    },
    destroy() {
      btn.destroy();
      txt.destroy();
    },
  };
}

export function createPlatformControls(scene, config = {}) {
  const {
    depth = 200,
    scrollFactor = 0,
    onJump,
  } = config;

  const state = { left: false, right: false };

  const makeHoldBtn = (x, y, w, h, label, dir) => {
    const btn = scene.add.rectangle(x, y, w, h, 0x223355, 0.82)
      .setScrollFactor(scrollFactor)
      .setDepth(depth)
      .setStrokeStyle(2, 0x88aacc, 0.85)
      .setInteractive({ useHandCursor: true });
    const txt = scene.add.text(x, y, label, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ddeeff',
    }).setOrigin(0.5).setScrollFactor(scrollFactor).setDepth(depth + 1);

    const press = () => {
      state[dir] = true;
      btn.setFillStyle(0x446688, 0.95);
    };
    const release = () => {
      state[dir] = false;
      btn.setFillStyle(0x223355, 0.82);
    };

    btn.on('pointerdown', press);
    btn.on('pointerup', release);
    btn.on('pointerout', release);
    btn.on('pointerupoutside', release);

    return { btn, txt };
  };

  const left = makeHoldBtn(72, 410, 58, 58, '◀', 'left');
  const right = makeHoldBtn(142, 410, 58, 58, '▶', 'right');
  const jump = scene.add.circle(728, 410, 34, 0x44aa88, 0.9)
    .setScrollFactor(scrollFactor)
    .setDepth(depth)
    .setStrokeStyle(2, 0xccffee, 0.9)
    .setInteractive({ useHandCursor: true });
  const jumpTxt = scene.add.text(728, 410, '↑', {
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: '22px',
    color: '#ffffff',
  }).setOrigin(0.5).setScrollFactor(scrollFactor).setDepth(depth + 1);

  jump.on('pointerdown', () => {
    jump.setFillStyle(0x66ccaa, 1);
    onJump?.();
  });
  jump.on('pointerup', () => jump.setFillStyle(0x44aa88, 0.9));
  jump.on('pointerout', () => jump.setFillStyle(0x44aa88, 0.9));

  const objects = [left.btn, left.txt, right.btn, right.txt, jump, jumpTxt];

  return {
    state,
    destroy() {
      objects.forEach((obj) => obj?.destroy());
    },
    setVisible(visible) {
      objects.forEach((obj) => obj?.setVisible(visible));
    },
  };
}
