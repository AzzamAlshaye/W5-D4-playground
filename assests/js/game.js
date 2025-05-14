// game.js
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
  // Define platforms & trophy layouts for each level:
  const levelConfigs = [
    // {
    //   platforms: [
    //     { x: 400, y: 584, scale: 2 }, // ground
    //     { x: 600, y: 400 },
    //     { x: 50, y: 250 },
    //     { x: 750, y: 220 },
    //   ],
    //   trophies: { repeat: 11, startX: 12, startY: 0, stepX: 70 },
    // },
    {
      platforms: [
        { x: 400, y: 550, scale: 2 }, //floor
        { x: 130, y: 300 },
        { x: 400, y: 410 }, //fist floor
        { x: 550, y: 190 },
        { x: 700, y: 300 },
      ],
      trophies: { repeat: 7, startX: 50, startY: 0, stepX: 100 },
    },
  ];

  let currentLevel = 0;
  let collectedThisLevel = 0;

  const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    width: 800,
    height: 600,
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 300 }, debug: false },
    },
    scene: { preload, create, update },
  };
  new Phaser.Game(config);

  function preload() {
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
  }

  function create() {
    // background
    this.add.image(400, 300, "sky");

    // build this level’s platforms
    this.platforms = this.physics.add.staticGroup();
    levelConfigs[currentLevel].platforms.forEach((p) => {
      const plt = this.platforms.create(p.x, p.y, "ground");
      if (p.scale) plt.setScale(p.scale).refreshBody();
    });

    // player
    this.player = this.physics.add
      .sprite(100, 450, "player")
      .setBounce(0.2)
      .setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    // animations
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

    // trophies for this level
    const cfg = levelConfigs[currentLevel].trophies;
    this.trophies = this.physics.add.group({
      key: "trophy",
      repeat: cfg.repeat,
      setXY: { x: cfg.startX, y: cfg.startY, stepX: cfg.stepX },
    });

    this.trophies.children.iterate((trophy) => {
      // give it a little bounce…
      trophy.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      // …and scale it down to 50%
      trophy.setScale(0.2);
    });

    this.physics.add.collider(this.trophies, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.trophies,
      collectTrophy,
      null,
      this
    );

    // controls & HUD
    this.cursors = this.input.keyboard.createCursorKeys();
    this.scoreText = this.add.text(
      16,
      16,
      `Level ${currentLevel + 1} – Collected: 0`,
      { fontSize: "24px", fill: "#000" }
    );
  }

  function update() {
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
  }

  async function collectTrophy(player, trophy) {
    trophy.disableBody(true, true);
    collectedThisLevel++;
    this.scoreText.setText(
      `Level ${currentLevel + 1} – Collected: ${collectedThisLevel}`
    );

    // save overall trophies:
    await updateTrophiesOnServer(
      // you might prefer to sum levels; here we just send the current-level count:
      collectedThisLevel + currentLevel * 1000 // optional offset per level
    );

    // when we’ve got them all, advance
    const needed = levelConfigs[currentLevel].trophies.repeat + 1;
    if (collectedThisLevel >= needed) {
      if (currentLevel < levelConfigs.length - 1) {
        currentLevel++;
        collectedThisLevel = 0;
        this.scene.restart(); // reload with next level
      } else {
        this.add.text(160, 250, "🎉 YOU WIN! 🎉", {
          fontSize: "48px",
          fill: "#000",
        });
      }
    }
  }

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
