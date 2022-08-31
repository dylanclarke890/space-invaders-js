function new2dCanvas(id, width, height) {
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  return [canvas, ctx];
}

function drawText(text, font, fillStyle, x, y, maxWidth = undefined) {
  if (font) ctx.font = font;
  if (fillStyle) ctx.fillStyle = fillStyle;
  ctx.fillText(text, x, y, maxWidth);
}

function randUpTo(num, floor = false) {
  const res = Math.random() * num;
  return floor ? Math.floor(res) : res;
}

function isCircleRectColliding(circle, rect) {
  const distX = Math.abs(circle.x - rect.x - rect.w / 2);
  const distY = Math.abs(circle.y - rect.y - rect.h / 2);
  if (distX > rect.w / 2 + circle.r) return false;
  if (distY > rect.h / 2 + circle.r) return false;
  if (distX <= rect.w / 2) return true;
  if (distY <= rect.h / 2) return true;
  const dx = distX - rect.w / 2;
  const dy = distY - rect.h / 2;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function isRectRectColliding(first, second) {
  if (!first || !second) return false;
  if (
    !(
      first.x > second.x + second.w ||
      first.x + first.w < second.x ||
      first.y > second.y + second.h ||
      first.y + first.h < second.y
    )
  ) {
    return true;
  }
  return false;
}

const [canvas, ctx] = new2dCanvas("play-area", 800, 500);
let canvasPosition = canvas.getBoundingClientRect();

const mouse = {
  x: 0,
  y: 0,
  w: 0.1,
  h: 0.1,
};

const keyboard = {
  left: false,
  right: false,
  firing: false,
};

window.addEventListener("keydown", (e) => {
  switch (e.code.toLowerCase()) {
    case "arrowright":
      keyboard.right = true;
      break;
    case "arrowleft":
      keyboard.left = true;
      break;
    case "space":
      keyboard.firing = true;
      break;
    default:
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.code.toLowerCase()) {
    case "arrowright":
      keyboard.right = false;
      break;
    case "arrowleft":
      keyboard.left = false;
      break;
    case "space":
      keyboard.firing = false;
      break;
    default:
      break;
  }
});

const setMousePosition = (e) => {
  mouse.x = e.x - (canvasPosition.left + 6);
  mouse.y = e.y - canvasPosition.top;
};

canvas.addEventListener("mousemove", (e) => {
  setMousePosition(e);
});

window.addEventListener("resize", () => {
  canvasPosition = canvas.getBoundingClientRect();
});

canvas.addEventListener("click", (e) => {
  setMousePosition(e);
});

class Player {
  constructor() {
    this.x = canvas.width / 2 - 20;
    this.y = canvas.height - 50;
    this.w = 40;
    this.h = 20;
    this.speed = 10;
    this.cooldownBetweenShots = 50;
    this.currentCooldown = 0;
  }

  update() {
    if (keyboard.right) this.x += this.speed;
    if (keyboard.left) this.x += -this.speed;
    if (this.x < 0) this.x = 0;
    if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

    if (this.currentCooldown === 0) {
      if (keyboard.firing) {
        state.projectiles.push(
          new Projectile(this.x + this.w / 2, this.y, -10)
        );
        this.currentCooldown = this.cooldownBetweenShots;
      }
    } else this.currentCooldown--;
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Projectile {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.r = 5;
    this.speed = speed;
    this.destroy = false;
  }

  update() {
    this.y += this.speed;
    this.destroy = this.y < 0 || this.y > canvas.height;
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Enemy {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.w = settings.enemy.w;
    this.h = settings.enemy.h;
    this.row = row;
  }

  update() {
    if (state.frame % 100 === this.row) {
      this.x += this.speed;
    }
  }

  draw() {
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class EnemyRow {
  constructor(row) {
    const enemies = [];
    const { w, h, gapX, gapY, offsetX, offsetY } = settings.enemy;
    for (let i = 0; i < 11; i++) {
      enemies.push(
        new Enemy(
          i * w + i * gapX + offsetX,
          row * h + row * gapY + offsetY,
          row
        )
      );
    }
    this.row = row;
    this.enemies = enemies;
    this.left = enemies[0].x;
    this.right = enemies[10].x + enemies[10].w;
    this.speed = 25;
  }

  update() {}

  draw() {
    for (let i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i]) continue;
      this.enemies[i].update();
      this.enemies[i].draw();
    }
  }

  cleanup() {
    this.enemies = this.enemies.map((e) =>
      e === null || e.destroy ? null : e
    );
  }
}

const state = {
  player: new Player(),
  projectiles: [],
  enemyRows: [],
  frame: 0,
};

const settings = {
  enemy: {
    w: 30,
    h: 30,
    gapX: 30,
    gapY: 20,
    offsetX: 90,
    offsetY: 50,
  },
};

(function initialize() {
  for (let i = 0; i < 5; i++) state.enemyRows.push(new EnemyRow(i));
})();

function handleObjects() {
  state.player.update();
  state.player.draw();

  for (let i = 0; i < state.projectiles.length; i++) {
    const projectile = state.projectiles[i];
    projectile.update();
    projectile.draw();
  }

  for (let i = 0; i < state.enemyRows.length; i++) {
    const row = state.enemyRows[i];
    row.update();
    row.draw();
  }
}

const isNotDestroyed = (val) => !val.destroy;
function cleanupObjects() {
  state.projectiles = state.projectiles.filter(isNotDestroyed);
}

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleObjects();
  cleanupObjects();
  state.frame++;
  requestAnimationFrame(animate);
})();