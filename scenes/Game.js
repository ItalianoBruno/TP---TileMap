// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Game extends Phaser.Scene {
  constructor() {
    super("game");
  }

  init() {
    this.score = 0;
    this.coleccionados = 5;
  }

  preload() {
    this.load.tilemapTiledJSON("map", "public/assets/tilemap/TileMap32.json");
    this.load.image("tileset", "public/assets/tileset.png");
    this.load.image("star", "public/assets/star.png");
    this.load.image("esquinas", "public/assets/esquinas.png");
    this.load.image("arbol", "public/assets/arbol.png");
    this.load.image("hacha", "public/assets/hacha.png");
    this.load.image("Cartel", "public/assets/Cartel.png");
    this.load.spritesheet("dude", "./public/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    console.log(this.coleccionados);
    // Crear el mapa
    const map = this.make.tilemap({ key: "map" });
    // Cargar los tilesets
    const tileset = map.addTilesetImage("TileSet32", "tileset");
    const esquinas = map.addTilesetImage("esquinas 2", "esquinas");
    const Cartel = map.addTilesetImage("Cartel", "Cartel");

    // Calcula la posición para el spawn del jugador
    const tileWidth = map.tileWidth;
    const tileHeight = map.tileHeight;
    const spawnX = 5 * tileWidth + tileWidth / 2;
    const spawnY = 115 * tileHeight + tileHeight / 2;

    //Player
    this.player = this.physics.add.sprite(spawnX, spawnY, "dude");
    this.player.setScale(1.25);
    //Vars del pj
    this.tieneHacha = false;

    // Cargar el mapa y las capas
    const pisoLayer = map.createLayer("Piso", [esquinas, tileset], 0, 0);
    const arbolLayer = map.createLayer("Arboles", [tileset, Cartel], 0, 0);
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
      HachaSprite.setOrigin(0, 0, 5);
      HachaSprite.setScale(0.12);
      HachaSprite.body.immovable = true;
      HachaSprite.body.allowGravity = false;
      this.physics.add.overlap(this.player, HachaSprite,
        (player, hacha) => { hacha.disableBody(true, true); this.tieneHacha = true; },
        null, this);
    }
    const Salida = objectsLayer.objects.find(obj => obj.name === "salida");
    if (Salida) {
  const salidaRect = this.add.graphics();
  salidaRect.fillStyle(0x808080, 0.95);
  salidaRect.fillRect(5, 0, 32, 76);
  salidaRect.x = Salida.x;
  salidaRect.y = Salida.y;

  const salidaZone = this.add.zone(Salida.x + 32, Salida.y + 38, 32, 76);
  this.physics.add.existing(salidaRect, true); // true = estático

  this.physics.add.collider(this.player, salidaRect, () => {
    if (this.coleccionados >= 5) {
      console.log("Has salido del mapa con suficientes coleccionables");
      this.scene.start("gameover", { score: this.score });
    } else {
      console.log("Necesitas al menos 5 coleccionables para salir");
    }
  }, null, this);
    }

    //Colectables
    this.stars = this.physics.add.group();
    objectsLayer.objects
      .filter(obj => obj.name === "colect")
      .forEach(obj => {
        const star = this.stars.create(obj.x, obj.y, "star").setOrigin(1.1, 0.25).setScale(1.5);
        star.body.allowGravity = false;
      });

    // Overlap para recolectar estrellas
    this.physics.add.overlap(this.player, this.stars, (player, star) => {
      star.disableBody(true, true);
      this.score += 100;
      this.coleccionados += 1;
      console.log("Coleccionados: ", this.coleccionados);
      console.log("Puntaje:", this.score);
    }, null, this);

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
  }

  update() {

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
