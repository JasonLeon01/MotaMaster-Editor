export interface Actor {
    id: number;
    name: string;
    file: string;
    attributes: { key: string, value: number }[];  // 改为数组形式
    wealth: { key: string, value: number }[];
    items: { key: string, value: number }[];
    equip_slot: string[];
    equip: number[];
    animation_id: number;
}

class GameDataRecorder {
    private root: string;
    private actorsInfo: Actor [];;

    constructor() {
        this.root = "";
        this.actorsInfo = [];
    }

    getRoot() {
        return this.root;
    }

    setRoot(path: string) {
        this.root = path;
    }

    getAllActorInfo() {
        return this.actorsInfo;
    }

    getActorInfo(id: number) {
        return this.actorsInfo[id];
    }

    setActorInfo(id: number, actorInfo: Actor) {
        this.actorsInfo[id] = actorInfo;
    }

    setAllActorInfo(actorsInfo: Actor[]) {
        this.actorsInfo = actorsInfo;
    }
}

const GameData = new GameDataRecorder();

export default GameData;