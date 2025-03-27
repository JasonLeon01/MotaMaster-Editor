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

export interface Actor {
    id: number;
    name: string;
    file: string;
    attr: { key: string, value: number }[];
    wealth: { key: string, value: number }[];
    items: { key: string, value: number }[];
    equip_slot: string[];
    equip: number[];
    animation_id: number;
}

export interface Item {
    id: number;
    name: string;
    file: [string, number, number];
    description: string;
    price: number;
    cost: boolean;
    event: number | null;
}

export interface Equip {
    id: number;
    name: string;
    file: [string, number, number];
    description: string;
    attr_plus: { key: string, value: number }[];
    price: number;
    type: string;
    animation_id: number;
}

export interface Enemy {
    id: number;
    name: string;
    description: string;
    special: { key: string, value: number[] }[];
    file: [string, number];
    attr: { key: string, value: number }[];
    drop: { key: string, value: number }[];
    items: { id: number, number: number }[];
}

export class GameDataRecorder {
    private root: string;
    private config: Config;
    private actorsInfo: Actor [];;
    private itemsInfo: Item [];
    private equipInfo: Equip [];
    private enemyInfo: Enemy[];

    constructor() {
        this.root = "";
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
        this.actorsInfo = [];
        this.itemsInfo = [];
        this.equipInfo = [];
        this.enemyInfo = [];
    }

    getRoot() {
        return this.root;
    }

    setRoot(path: string) {
        this.root = path;
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

    getAllItemInfo() {
        return this.itemsInfo;
    }

    getItemInfo(id: number) {
        return this.itemsInfo[id];
    }

    setItemInfo(id: number, itemInfo: Item) {
        this.itemsInfo[id] = itemInfo;
    }

    setAllItemInfo(itemsInfo: Item[]) {
        this.itemsInfo = itemsInfo;
    }

    getAllEquipInfo() {
        return this.equipInfo;
    }

    getEquipInfo(id: number) {
        return this.equipInfo[id];
    }

    setEquipInfo(id: number, equipInfo: Equip) {
        this.equipInfo[id] = equipInfo;
    }

    setAllEquipInfo(equipInfo: Equip[]) {
        this.equipInfo = equipInfo;
    }

    getAllEnemyInfo() {
        return this.enemyInfo;
    }

    getEnemyInfo(id: number) {
        return this.enemyInfo[id];
    }

    setEnemyInfo(id: number, enemyInfo: Enemy) {
        this.enemyInfo[id] = enemyInfo;
    }

    setAllEnemyInfo(enemyInfo: Enemy[]) {
        this.enemyInfo = enemyInfo;
    }

    getCopyToAllData() {
        const data = new GameDataRecorder();
        data.setRoot(this.root);
        data.setConfig(JSON.parse(JSON.stringify(this.config)));
        data.setAllActorInfo(this.actorsInfo.map(actor => ({
            ...actor,
            attr: actor.attr.map(attr => ({ ...attr })),
            wealth: actor.wealth.map(w => ({ ...w })),
            items: actor.items.map(item => ({ ...item })),
            equip_slot: [...actor.equip_slot],
            equip: [...actor.equip]
        })));
        data.setAllItemInfo(this.itemsInfo.map(item => ({
            ...item,
            file: [...item.file]
        })));
        data.setAllEquipInfo(this.equipInfo.map(equip => ({
            ...equip,
            file: [...equip.file],
            attr_plus: equip.attr_plus.map(attr => ({ ...attr }))
        })));
        data.setAllEnemyInfo(this.enemyInfo.map(enemy => ({
           ...enemy,
            file: [...enemy.file],
            attr: enemy.attr.map(attr => ({...attr })),
            drop: enemy.drop.map(drop => ({...drop })),
            items: enemy.items.map(item => ({...item }))
        })))
        return data;
    }
}

const GameData = new GameDataRecorder();

export default GameData;