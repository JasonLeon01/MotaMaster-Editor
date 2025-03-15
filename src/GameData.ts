class GameDataRecorder {
    private root: string;

    constructor() {
        this.root = "";
    }

    getRoot() {
        return this.root;
    }

    setRoot(path: string) {
        this.root = path;
    }
}

const GameData = new GameDataRecorder();

export default GameData;