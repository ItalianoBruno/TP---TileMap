export default class GameOver extends Phaser.Scene {
  constructor() {
    super("gameover");
  }

  init(data) {
    this.score = data && data.score ? data.score : 0;
  }

  create() {
    // Muestra el puntaje y coleccionados en pantalla
    this.add.text(300, 300, `Puntaje: ${this.score}`, { fontSize: '32px', fill: '#fff' });
  }
}