let player;
let bullets = [];
let enemies = [];
let medkits = [];
let gasRadius;
let score = 0;
let difficulty = 1;
let lastEnemySpawn = 0;
let lastShot = 0;
let shotCooldown = 200;
let gameOver = false;
let bombsAvailable = 0;
let bombEffect = 0;

function setup() {
  createCanvas(800, 600);
  player = new Player();
  bullets = [];
  enemies = [];
  medkits = [];
  gasRadius = 600;
  score = 0;
  difficulty = 1;
  lastEnemySpawn = 0;
  lastShot = 0;
  gameOver = false;
  bombsAvailable = 0;
  bombEffect = 0;

  setInterval(() => {
    medkits.push(new Medkit());
  }, 10000);
}

function draw() {
  background(50);

  // Efeito visual da bomba
  if (bombEffect > 0) {
    fill(255, 0, 0, bombEffect);
    rect(0, 0, width, height);
    bombEffect -= 10;
  }

  // Gás
  noFill();
  stroke(0, 255, 0);
  strokeWeight(4);
  circle(width / 2, height / 2, gasRadius);

  // Jogador
  player.update();
  player.display();

  // Mira apontando para o centro
  let angleToCenter = atan2((height / 2) - player.y, (width / 2) - player.x);
  push();
  translate(player.x, player.y);
  rotate(angleToCenter);
  fill(255);
  triangle(15, 0, -5, 5, -5, -5);
  pop();

  // Tiros
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].display();

    if (
      bullets[i].x < 0 || bullets[i].x > width ||
      bullets[i].y < 0 || bullets[i].y > height
    ) {
      bullets.splice(i, 1);
    }
  }

  // Inimigos
  if (millis() - lastEnemySpawn > 2500 / difficulty) {
    enemies.push(new Enemy());
    lastEnemySpawn = millis();
    difficulty += 0.05;
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.update();
    e.display();

    if (dist(e.x, e.y, player.x, player.y) < 25) {
      e.lastHit = e.lastHit || 0;
      if (millis() - e.lastHit > 1000) {
        player.hp -= 10;
        e.lastHit = millis();
        if (player.hp <= 0) {
          gameOver = true;
          noLoop();
        }
      }
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (dist(e.x, e.y, bullets[j].x, bullets[j].y) < 20) {
        score += (e.speed > 1.5 ? 2 : 1);
        if (score % 20 === 0) bombsAvailable++; // +1 bomba a cada 20 pontos
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }
  }

  // Medkits
  for (let i = medkits.length - 1; i >= 0; i--) {
    medkits[i].display();
    if (dist(player.x, player.y, medkits[i].x, medkits[i].y) < 20) {
      player.hp = min(player.hp + 30, 100);
      medkits.splice(i, 1);
    }
  }

  // Gás
  gasRadius -= 0.1;
  if (dist(player.x, player.y, width / 2, height / 2) > gasRadius / 2) {
    fill(255, 0, 0);
    textSize(20);
    textAlign(CENTER);
    text("SAINDO DO GÁS!", width / 2, 30);
    player.hp -= 0.1;
  }

  // HUD
  fill(255);
  textSize(16);
  textAlign(LEFT);
  text("Eliminações: " + score, 10, 20);
  text("Bombas: " + bombsAvailable, 10, 50);

  // Barra de vida
  stroke(255);
  noFill();
  rect(10, 30, 100, 10);
  noStroke();
  fill(lerpColor(color(255, 0, 0), color(0, 255, 0), player.hp / 100));
  rect(10, 30, player.hp, 10);

  if (gameOver) {
    fill(255, 0, 0);
    textSize(40);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 2);
    textSize(20);
    text("Clique para reiniciar", width / 2, height / 2 + 50);
  }
}

function mousePressed() {
  if (gameOver) {
    setup();
    loop();
  } else if (millis() - lastShot > shotCooldown) {
    bullets.push(new Bullet(player.x, player.y, mouseX, mouseY));
    lastShot = millis();
  }
}

function keyPressed() {
  if (key === 'e' || key === 'E') {
    if (bombsAvailable > 0) {
      enemies = [];
      bombsAvailable--;
      bombEffect = 150; // Intensidade da explosão visual
    }
  }
}

// === Classes ===

class Player {
  constructor() {
    this.x = width / 2;
    this.y = height / 2;
    this.speed = 3;
    this.hp = 100;
  }

  update() {
    if (keyIsDown(87)) this.y -= this.speed;
    if (keyIsDown(83)) this.y += this.speed;
    if (keyIsDown(65)) this.x -= this.speed;
    if (keyIsDown(68)) this.x += this.speed;
  }

  display() {
    fill(0, 0, 255);
    ellipse(this.x, this.y, 30);
    stroke(255);
    line(this.x, this.y, mouseX, mouseY);
  }
}

class Bullet {
  constructor(x, y, tx, ty) {
    this.x = x;
    this.y = y;
    let angle = atan2(ty - y, tx - x);
    this.vx = cos(angle) * 6;
    this.vy = sin(angle) * 6;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  display() {
    fill(255, 255, 0);
    ellipse(this.x, this.y, 8);
  }
}

class Enemy {
  constructor() {
    let edge = floor(random(4));
    if (edge === 0) { this.x = 0; this.y = random(height); }
    if (edge === 1) { this.x = width; this.y = random(height); }
    if (edge === 2) { this.x = random(width); this.y = 0; }
    if (edge === 3) { this.x = random(width); this.y = height; }

    // inimigos mais lentos
    this.speed = random() < 0.2 ? 1.8 : 1.0;
  }

  update() {
    let angle = atan2(player.y - this.y, player.x - this.x);
    this.x += cos(angle) * this.speed;
    this.y += sin(angle) * this.speed;
  }

  display() {
    fill(this.speed > 1.5 ? 255 : 255, 0, this.speed > 1.5 ? 255 : 0);
    ellipse(this.x, this.y, 30);
  }
}

class Medkit {
  constructor() {
    this.x = random(50, width - 50);
    this.y = random(50, height - 50);
  }

  display() {
    fill(0, 255, 0);
    rect(this.x - 10, this.y - 10, 20, 20);
    fill(255);
    textSize(12);
    textAlign(CENTER, CENTER);
    text("+", this.x, this.y);
  }
}