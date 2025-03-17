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

export interface Config {
    system: {
        title_icon: string;
        title_file: string;
        title_bgm: string;
        font_name: string[];
        font_size: number;
        windowskin_file: string;
        window_opacity: number;
    },
    audio: {
        cursor_se: string;
        decision_se: string;
        cancel_se: string;
        buzzer_se: string;
        shop_se: string;
        save_se: string;
        load_se: string;
        gate_se: string;
        stair_se: string;
        get_se: string;
    }
}

class GameDataRecorder {
    private root: string;
    private actorsInfo: Actor [];;
    private config: Config;

    constructor() {
        this.root = "";
        this.actorsInfo = [];
        this.config = {
            system: {
                title_icon: "",
                title_file: "",
                title_bgm: "",
                font_name: [""],
                font_size: 0,
                windowskin_file: "",
                window_opacity: 0,
            },
            audio: {
                cursor_se: "",
                decision_se: "",
                cancel_se: "",
                buzzer_se: "",
                shop_se: "",
                save_se: "",
                load_se: "",
                gate_se: "",
                stair_se: "",
                get_se: "",
            }
        };
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

    getConfig() {
        return this.config;
    }

    setConfig(config: Config) {
        this.config = config;
    }

    getConfigAt(key1: keyof Config, key2: keyof Config[keyof Config]) {
        return this.config[key1][key2];
    }

    setConfigAt(key1: keyof Config, key2: keyof Config[keyof Config], value: string | number | string[]) {
        if (Array.isArray(this.config[key1][key2])) {
            if (Array.isArray(value)) {
                (this.config[key1][key2] as string[]) = value;
            } else {
                (this.config[key1][key2] as string[]) = [value as string];
            }
        } else {
            this.config[key1][key2] = value as never;
        }
    }
}

const GameData = new GameDataRecorder();

export default GameData;