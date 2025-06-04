// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Game extends Phaser.Scene {
  constructor() {
    super("game");
  }

  init() {
    this.score = 0;
  }

  preload() {
    this.load.tilemapTiledJSON("map", "public/assets/tilemap/TileMap32.json");
    this.load.image("tileset", "public/assets/tileset.png");
    this.load.image("star", "public/assets/star.png");
    this.load.image("esquinas", "public/assets/esquinas.png");
    this.load.image("arbol", "public/assets/arbol.png");
    this.load.image("hacha", "public/assets/hacha.png");
    this.load.spritesheet("dude", "./public/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    // Crear el mapa
    const map = this.make.tilemap({ key: "map" });
    // Cargar los tilesets
    const tileset = map.addTilesetImage("TileSet32", "tileset");
    const esquinas = map.addTilesetImage("esquinas 2", "esquinas");

    // Calcula la posición para el spawn del jugador
    const tileWidth = map.tileWidth;
    const tileHeight = map.tileHeight;
    const spawnX = 59 * tileWidth + tileWidth / 2;
    const spawnY = 59 * tileHeight + tileHeight / 2;

    //Player
    this.player = this.physics.add.sprite(spawnX, spawnY, "dude");
    this.player.setScale(1.25);
    //Vars del pj
    this.tieneHacha = false;

    // Cargar el mapa y las capas
    const pisoLayer = map.createLayer("Piso", [esquinas, tileset], 0, 0);
    const arbolLayer = map.createLayer("Arboles", tileset, 0, 0);
    const arbol2Layer = map.createLayer("Arboles2", tileset, 0, 0);
    // Capa de objetos
    const objectsLayer = map.getObjectLayer("Objetos");
    //Objetos
    const arbolObj = objectsLayer.objects.find(obj => obj.name === "ArbolArDer");
    if (arbolObj) {
      const arbolSprite = this.physics.add.sprite(arbolObj.x, arbolObj.y, "arbol");
      arbolSprite.setOrigin(0.5, 0.80468);
      arbolSprite.body.immovable = true;
      arbolSprite.body.allowGravity = false;
      this.physics.add.collider(this.player, arbolSprite, this.talarArbol, null, this)
    }
    const HachaObj = objectsLayer.objects.find(obj => obj.name === "Hacha");
    if (HachaObj) {
      const HachaSprite = this.physics.add.sprite(HachaObj.x, HachaObj.y, "hacha");
      HachaSprite.setOrigin(0, 0.5);
      HachaSprite.setScale(0.12);
      HachaSprite.body.immovable = true;
      HachaSprite.body.allowGravity = false;
      this.physics.add.overlap(this.player, HachaSprite,
        (player, hacha) => { hacha.disableBody(true, true); this.tieneHacha = true; },
        null, this);
    }

    //Camara
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.25);
    // Limita la cámara al tamaño del mapa
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    //Animación del jugador
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 8,
      repeat: -1,
    });

    //coliciones del suelo
    pisoLayer.setCollisionByProperty({ esColision: true });
    this.physics.add.collider(this.player, pisoLayer);
    // colisiones de los arboles
    arbolLayer.setCollisionByProperty({ esColision: true });
    this.physics.add.collider(this.player, arbolLayer);
    arbol2Layer.setCollisionByProperty({ esColision: true });
    this.physics.add.collider(this.player, arbol2Layer);

    //Profundidad de las capas
    pisoLayer.setDepth(0);
    this.player.setDepth(1);
    arbolLayer.setDepth(2);
    arbol2Layer.setDepth(2);

    //Resumir Teclas
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.interact = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // vel pj
    this.speed = 180;

    // --- EFECTO DE VISIÓN LIMITADA ---
    this.visionRadius = 180; // Ajusta el radio de visión a gusto

    // RenderTexture para la niebla
    this.fogRT = this.add.renderTexture(0, 0, map.widthInPixels, map.heightInPixels).setDepth(1000).setScrollFactor(0);
    // Graphics para el círculo de visión
    this.visionMask = this.add.graphics();
    this.visionMask.setVisible(true);

  }

  update() {

    // --- EFECTO DE VISIÓN LIMITADA ---
    // Limpia la niebla - Dibuja la capa negra
    this.fogRT.clear();
    this.fogRT.fill(0x000000, 0.5);

    // Dibuja el círculo de visión en la posición relativa a la cámara
    this.visionMask.clear();
    this.visionMask.fillStyle(0xffffff, 1);
    // Calcula la posición del jugador en pantalla (por si la cámara se mueve)
    const cam = this.cameras.main;
    const px = this.player.x - cam.scrollX;
    const py = this.player.y - cam.scrollY;
    this.visionMask.fillCircle(px, py, this.visionRadius);

    // Borra la niebla en la zona visible
    this.fogRT.erase(this.visionMask);

    // update game objects
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-this.speed);
      this.player.anims.play("left", true);
    }
    if (this.cursors.right.isDown) {
      this.player.setVelocityX(this.speed);
      this.player.anims.play("right", true);
    }
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-this.speed);
    }
    if (this.cursors.down.isDown) {
      this.player.setVelocityY(this.speed);
    }
    if (this.cursors.left.isUp && this.cursors.right.isUp && this.cursors.up.isUp && this.cursors.down.isUp) {
      this.player.anims.play("turn", true);
    }
    if (this.cursors.left.isUp && this.cursors.right.isUp) {
      // If no cursor keys are pressed, stop the player
      this.player.setVelocityX(0);
    }
    if (this.cursors.up.isUp && this.cursors.down.isUp) {
      // If no cursor keys are pressed, stop the player
      this.player.setVelocityY(0);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      console.log("Phaser.Input.Keyboard.JustDown(this.keyR)");
      this.scene.restart();
    }
  }

  talarArbol(player, arbol) {
    if (this.tieneHacha) {
      console.log("puedes talar");
      arbol.destroy();
    } else {
      console.log("no puedes talar")
    }
  }
}
