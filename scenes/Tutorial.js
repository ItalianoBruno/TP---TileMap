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
    this.load.image("Martillo", "public/assets/Martillo.png");
    this.load.image("CartelIzq", "public/assets/CartelPie.png");
    this.load.image("CartelDer", "public/assets/CartelPieDer.png");
    this.load.image("Pared", "public/assets/Pared.png");
    this.load.image("portal", "public/assets/Portal.png");
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
      this.physics.add.collider(this.player, paredSprite, this.romperPared, null, this)
    }

    const MartilloObj = objectsLayer.objects.find(obj => obj.name === "llave 2");
    if (MartilloObj) {
      const MartilloSprite = this.physics.add.sprite(MartilloObj.x, MartilloObj.y, "Martillo");
      MartilloSprite.setOrigin(0.43, 0.43, 5);
      MartilloSprite.setScale(0.15);
      MartilloSprite.body.immovable = true;
      MartilloSprite.body.allowGravity = false;
      this.physics.add.overlap(this.player, MartilloSprite,
        (player, Martillo) => { Martillo.disableBody(true, true); this.tieneMartillo = true; },
        null, this);
    }

    //Salida
    const Salida = objectsLayer.objects.find(obj => obj.name === "Salida");
    if (Salida) {
      // Crea el sprite del portal en la posición del objeto "salida"
      const portal = this.physics.add.sprite(Salida.x + 16, Salida.y + 38, "portal");
      portal.setImmovable(true);
      portal.setOrigin(0.75, 0.75);
      portal.setScale(0.075);
      portal.body.allowGravity = false;
      portal.setDepth(2); // Opcional, para que esté sobre el piso

      // Colisión física con el portal
      this.physics.add.collider(this.player, portal, () => {
        if (this.coleccionados >= 1) {
          console.log("Has salido del mapa con suficientes coleccionables");
          this.scene.start("game", { score: this.score });
        } else {
          console.log("Necesitas al menos 5 coleccionables para salir");
        }
      }, null, this);
    }

    //Colectables
    this.stars = this.physics.add.group();
    objectsLayer.objects
      .filter(obj => obj.name === "llave 1")
      .forEach(obj => {
        const star = this.stars.create(obj.x, obj.y, "star").setOrigin(0.45, 0.45).setScale(1.5);
      });

      this.coleccionados = 0
      this.score = 0;
    // Overlap para recolectar estrellas
    this.physics.add.overlap(this.player, this.stars, (player, star) => {
      star.disableBody(true, true);
      this.score += 100;
      this.coleccionados += 1;
      console.log("Coleccionados: ", this.coleccionados);
      console.log("Puntaje:", this.score);
    }, null, this);

     //Resumir Teclas
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.interact = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);


    // Mensajes de los carteles
    const cartelMensajes = {
      Cartel1: "¡Bienvenido al tutorial!\n\nRecolecta estrellas para viajar a travez de los portales.\n\n-Espacio-",
      Cartel2: "Usa herramientas para atravezar obstáculos.\n\n-Espacio-"
    };

    // Grupo para los carteles
    this.carteles = this.physics.add.group();

    ["Cartel1", "Cartel2"].forEach(nombre => {
      const obj = objectsLayer.objects.find(o => o.name === nombre);
      if (obj) {
        const cartel = this.carteles.create(obj.x, obj.y, "CartelIzq").setOrigin(0.5, 0.8).setImmovable(true);
        cartel.nombreCartel = nombre; // Guarda el nombre para identificar el mensaje
      }
    });

    // Fondo y texto del mensaje (inicialmente ocultos)
    this.cartelFondo = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, 500, 200, 0x000000, 0.8)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);
    this.cartelTexto = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "", {
      fontSize: "18px",
      color: "#fff",
      align: "center",
      wordWrap: { width: 480 },
      fontFamily: '"Press Start 2P"'
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setVisible(false);

    // Estado para saber si hay mensaje activo
    this.mensajeActivo = false;

    // Overlap con los carteles
    this.physics.add.collider(this.player, this.carteles, (player, cartel) => {
      if (!this.mensajeActivo) {
        this.cartelFondo.setVisible(true);
        this.cartelTexto.setText(cartelMensajes[cartel.nombreCartel] || "Cartel").setVisible(true);
        this.mensajeActivo = true;
        this.player.setVelocity(0, 0); // Opcional: frena al jugador
        this.physics.world.pause();    // Opcional: pausa físicas mientras se lee el cartel
      }
    }, null, this);
    
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
    if (this.mensajeActivo && Phaser.Input.Keyboard.JustDown(this.interact)) {
      this.cartelFondo.setVisible(false);
      this.cartelTexto.setVisible(false);
      this.mensajeActivo = false;
      this.physics.world.resume(); // Si pausaste el mundo, reanúdalo
    }

  }

  romperPared(player, Pared) {
    if (this.tieneMartillo) {
      console.log("puedes romper");
      Pared.destroy();
    } else {
      console.log("no puedes romper")
    }
  }

}