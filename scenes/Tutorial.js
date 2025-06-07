export default class Tutorial extends Phaser.Scene {
  constructor() {
    super({ key: 'Tutorial' });
  }

  init() {
  }

  preload() {
    this.load.tilemapTiledJSON("map", "public/assets/tilemap/Tutorial32.json");
    this.load.image("tileset", "public/assets/tileset.png");
    this.load.image("star", "public/assets/star.png");
    this.load.image("esquinas", "public/assets/esquinas.png");
    this.load.image("arbol", "public/assets/arbol.png");
    this.load.image("hacha", "public/assets/hacha.png");
    this.load.image("Cartel", "public/assets/Cartel.png");
    this.load.image("Pared", "public/assets/Pared.png");
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
    const spawnX = 17.5 * tileWidth + tileWidth / 2;
    const spawnY = 32 * tileHeight + tileHeight / 2;

    //Player
    this.player = this.physics.add.sprite(spawnX, spawnY, "dude");
    this.player.setScale(1.25);

    //Camara
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.715);
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

    // Cargar el mapa y las capas
    const pisoLayer = map.createLayer("Piso", [esquinas, tileset], 0, 0);
    const objectsLayer = map.getObjectLayer("Objetos");

    //coliciones del suelo
    pisoLayer.setCollisionByProperty({ esColision: true });
    this.physics.add.collider(this.player, pisoLayer);
    
    pisoLayer.setDepth(0);
    this.player.setDepth(1);

    const paredObj = objectsLayer.objects.find(obj => obj.name === "pared");
    if (paredObj) {
      const paredSprite = this.physics.add.sprite(paredObj.x, paredObj.y, "Pared");
      paredSprite.setOrigin(0.5, 0.80468);
      paredSprite.body.immovable = true;
      paredSprite.body.allowGravity = false;
      this.physics.add.collider(this.player, paredSprite, this.talarArbol, null, this)
    }

     //Resumir Teclas
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.interact = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // vel pj
    this.speed = 180;
  }

  update() {

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
}