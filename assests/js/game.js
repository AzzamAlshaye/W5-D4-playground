(() => {
  const apiBase = "https://68243c9365ba0580339965d9.mockapi.io/login";
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("userId");

  if (!username || !userId) {
    alert("Please log in to play.");
    window.location.href = "./login.html";
    return;
  }

  // ─── LEVEL CONFIGS ─────────────────────────────────────────────────────────
  const levelConfigs = [
    {
      // floating platforms
      platforms: [
        { x: 400, y: 450 },
        { x: 700, y: 300 },
      ],
      trophies: { repeat: 5, startX: 150, startY: 0, stepX: 200 },
      enemies: [
        { x: 300, y: 520 },
        { x: 600, y: 520 },
      ],
    },
    {
      platforms: [
        { x: 500, y: 350 },
        { x: 900, y: 450 },
      ],
      trophies: { repeat: 3, startX: 200, startY: 0, stepX: 300 },
      enemies: [
        { x: 450, y: 320 },
        { x: 800, y: 420 },
      ],
    },
  ];

  let currentLevel = 0;
  let collectedThisLevel = 0;
  let totalCollected = 0;

  const WORLD_WIDTH = 1600;
  const WORLD_HEIGHT = 600;

  const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    width: 800,
    height: WORLD_HEIGHT,
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 300 }, debug: false },
    },
    scene: { preload, create, update },
  };
  new Phaser.Game(config);

  function preload() {
    this.load.tilemapTiledJSON; // ensure Phaser.TileSprite plugin is loaded
    this.load.image(
      "sky",
      "https://images3.alphacoders.com/126/thumb-1920-1269904.png"
    );
    this.load.image(
      "ground",
      "https://labs.phaser.io/assets/sprites/platform.png"
    );
    this.load.image(
      "trophy",
      "https://png.pngtree.com/png-vector/20220824/ourmid/pngtree-star-png-vector-icon-ui-game-png-image_6121753.png"
    );
    this.load.spritesheet(
      "player",
      "https://labs.phaser.io/assets/sprites/dude.png",
      { frameWidth: 32, frameHeight: 48 }
    );
    this.load.image("goomba", "./assests/images/goomba.png");
  }

  function create() {
    // 1) background that always covers the camera view
    this.add.tileSprite(0, 0, 800, 600, "sky").setOrigin(0).setScrollFactor(0);

    // 2) world bounds & camera
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 3) full‐width floor
    this.platforms = this.physics.add.staticGroup();
    const floor = this.platforms.create(WORLD_WIDTH / 2, 584, "ground");
    floor.setDisplaySize(WORLD_WIDTH, 32).refreshBody();

    // 4) floating platforms
    levelConfigs[currentLevel].platforms.forEach((p) => {
      const plt = this.platforms.create(p.x, p.y, "ground");
      if (p.scale) plt.setScale(p.scale).refreshBody();
    });

    // 5) player setup
    this.player = this.physics.add
      .sprite(100, 450, "player")
      .setBounce(0.2)
      .setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);
    this.cameras.main.startFollow(this.player); // instant follow

    // player animations
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "turn",
      frames: [{ key: "player", frame: 4 }],
      frameRate: 20,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    // 6) trophies
    const tcfg = levelConfigs[currentLevel].trophies;
    this.trophies = this.physics.add.group({
      key: "trophy",
      repeat: tcfg.repeat,
      setXY: { x: tcfg.startX, y: tcfg.startY, stepX: tcfg.stepX },
    });
    this.trophies.children.iterate((t) => {
      t.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)).setScale(0.2);
    });
    this.physics.add.collider(this.trophies, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.trophies,
      collectTrophy,
      null,
      this
    );

    // 7) Goombas
    this.enemies = this.physics.add.group();
    levelConfigs[currentLevel].enemies.forEach((pos) => {
      const e = this.enemies
        .create(pos.x, pos.y, "goomba")
        .setScale(0.1)
        .setCollideWorldBounds(true);
      // give it a random left/right patrol speed
      e.setVelocityX(Phaser.Math.Between(-80, 80));

      // (optional) give it an initial upward kick so it immediately bounces:
      e.setVelocityY(-Phaser.Math.Between(50, 100));
      e.body.allowGravity = true;
      e.setBounce(1, 0.4);
    });
    // allow Goombas to land & bounce on platforms:
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.player, this.enemies, hitEnemy, null, this);

    // 8) controls & HUD
    this.cursors = this.input.keyboard.createCursorKeys();
    this.scoreText = this.add
      .text(16, 16, `Level ${currentLevel + 1} – Collected: 0 (Total: 0)`, {
        fontSize: "24px",
        fill: "#000",
      })
      .setScrollFactor(0);

    this.isDead = false;
    this.levelComplete = false;
  }

  function update() {
    if (this.isDead || this.levelComplete) return;

    // movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160).anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160).anims.play("right", true);
    } else {
      this.player.setVelocityX(0).anims.play("turn");
    }
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }

    // fall‐death
    if (this.player.y > WORLD_HEIGHT) {
      triggerDeath.call(this);
    }
  }

  // collect trophies
  async function collectTrophy(player, trophy) {
    trophy.disableBody(true, true);
    collectedThisLevel++;
    totalCollected++;
    this.scoreText.setText(
      `Level ${
        currentLevel + 1
      } – Collected: ${collectedThisLevel} (Total: ${totalCollected})`
    );
    await updateTrophiesOnServer(totalCollected);

    const needed = levelConfigs[currentLevel].trophies.repeat + 1;
    if (collectedThisLevel >= needed) {
      triggerLevelComplete.call(this);
    }
  }

  // player ↔ Goomba collision
  function hitEnemy(player, enemy) {
    if (player.body.velocity.y > 0) {
      enemy.disableBody(true, true);
      player.setVelocityY(-150);
    } else {
      triggerDeath.call(this);
    }
  }

  // death
  function triggerDeath() {
    this.isDead = true;
    this.physics.pause();
    this.player.setTint(0xff0000);
    const cam = this.cameras.main;
    this.add
      .text(
        cam.scrollX + cam.width / 2,
        cam.height / 2,
        "💀 You died! Click to retry",
        { fontSize: "32px", fill: "#fff", backgroundColor: "#000" }
      )
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => {
        currentLevel = 0;
        collectedThisLevel = 0;
        totalCollected = 0;
        this.scene.restart();
      });
  }

  // level complete & auto‐advance
  function triggerLevelComplete() {
    this.levelComplete = true;
    this.physics.pause();
    const cam = this.cameras.main;
    const isLast = currentLevel >= levelConfigs.length - 1;
    const text = isLast
      ? "🎉 All levels done! Click to try again"
      : `✅ Level ${currentLevel + 1} complete!`;

    const msg = this.add
      .text(cam.scrollX + cam.width / 2, cam.height / 2, text, {
        fontSize: "32px",
        fill: "#fff",
        backgroundColor: "#000",
      })
      .setOrigin(0.5);

    if (isLast) {
      msg.setInteractive().on("pointerdown", () => {
        currentLevel = 0;
        collectedThisLevel = 0;
        totalCollected = 0;
        this.scene.restart();
      });
    } else {
      this.time.delayedCall(2000, () => {
        currentLevel++;
        collectedThisLevel = 0;
        this.scene.restart();
      });
    }
  }

  // server update
  async function updateTrophiesOnServer(count) {
    try {
      await fetch(`${apiBase}/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trophies: count }),
      });
    } catch (err) {
      console.error("Failed to update trophies:", err);
    }
  }
})();
