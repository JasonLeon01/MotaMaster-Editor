export interface Config {
    system: {
        title_icon: string;
        title_file: string;
        title_bgm: string;
        font_name: string[];
        font_size: number;
        windowskin_file: string;
        window_opacity: number;
        cell_size: number;
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

export interface Tilemap {
    id: number;
    name: string;
    file: string;
    walkable: boolean[][];
    collisionFlags: { up: boolean, left: boolean, down: boolean, right: boolean }[][];
    events: number[][];
}

export interface Order {
    content: string;
    params: string[];
}

export interface Event {
    id: number;
    name: string;
    appear: string;
    orders: Order[];
    adjacency: { from: number, to: number[] };
}

export interface Map_ {
    filename: string;
    name: string;
    description: string;
    region: string;
    width: number;
    height: number;
    bgm: string;
    bgs: string;
    layers: {
        name: string;
        tilemap: number;
        tiles: number[][];
        events: { [key: number]: Event };
    }[];
}

export interface MapInfo {
    region: string;
    data: Map_[];
}

export class GameDataRecorder {
    private root: string;
    private config: Config;
    private actorsInfo: Actor [];;
    private itemsInfo: Item [];
    private equipInfo: Equip [];
    private enemyInfo: Enemy[];
    private tilemapsInfo: Tilemap[];
    private mapsRecord: Map<string, Map<string, Map_>>;
    private mapsInfo: MapInfo[];

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
                cell_size: 32,
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
        this.tilemapsInfo = [];
        this.mapsRecord = new Map();
        this.mapsInfo = [];
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

    getAllTilemapInfo() {
        return this.tilemapsInfo;
    }

    getTilemapInfo(id: number) {
        return this.tilemapsInfo[id];
    }

    setTilemapInfo(id: number, tilemapInfo: Tilemap) {
        this.tilemapsInfo[id] = tilemapInfo;
    }

    setAllTilemapInfo(tilemapInfo: Tilemap[]) {
        this.tilemapsInfo = tilemapInfo;
    }

    getAllMapsInfo() {
        return this.mapsInfo;
    }

    getMapListInfo(region: string) {
        return this.mapsInfo.find(mapInfo => mapInfo.region === region)?.data ?? [];
    }

    getMapInfo(region: string, mapID: number) {
        return this.mapsInfo.find(mapInfo => mapInfo.region === region)?.data[mapID] ?? null;
    }

    getAllMapsRecord() {
        return this.mapsRecord;
    }

    getMapRecord(region: string, filename: string) {
        return this.mapsRecord.get(region)?.get(filename)?? null;
    }

    setMapInfo(region: string, mapID: number, mapInfo: Map_) {
        if (!this.mapsRecord.has(region)) {
            this.mapsRecord.set(region, new Map());
        }
        const mapInfoList = this.mapsInfo.find(mapInfo => mapInfo.region === region)?.data;
        if (mapInfoList) {
            if (mapID < mapInfoList.length) {
                mapInfoList[mapID] = mapInfo;
            } else {
                mapInfoList.push(mapInfo);
            }
        } else {
            this.mapsInfo.push({
                region: region,
                data: [mapInfo]
            })
        }
    }

    setAllMapsInfo(mapsInfo: MapInfo[]) {
        this.mapsInfo = mapsInfo;
    }

    setMapListInfo(region: string, mapInfoList: Map_[]) {
        if (!this.mapsRecord.has(region)) {
            this.mapsRecord.set(region, new Map());
        }
        if (this.mapsInfo.find(mapInfo => mapInfo.region === region)) {
            this.mapsInfo.find(mapInfo => mapInfo.region === region)!.data = mapInfoList;
        } else {
            this.mapsInfo.push({
                region: region,
                data: mapInfoList
            })
        }
    }

    setMapRecord(region: string, filename: string, mapInfo: Map_) {
        if (!this.mapsRecord.has(region)) {
            this.mapsRecord.set(region, new Map());
        }
        this.mapsRecord.get(region)!.set(filename, mapInfo);
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
        data.setAllTilemapInfo(this.tilemapsInfo.map(tilemap => ({
            ...tilemap,
            walkable: tilemap.walkable.map(row => [...row]),
            collisionFlags: tilemap.collisionFlags.map(row => [...row]),
            events: tilemap.events.map(row => [...row])
        })))
        data.setAllMapsInfo(this.mapsInfo.map(mapInfo => ({
            ...mapInfo,
            data: Array.isArray(mapInfo.data) ? mapInfo.data.map(map => ({
                ...map,
                layers: Array.isArray(map.layers) ? map.layers.map(layer => ({
                    ...layer,
                    tiles: layer.tiles.map(row => [...row]),
                    events: { ...layer.events }
                })) : []
            })) : []
        })));
        data.mapsRecord = new Map(this.mapsRecord);
        return data;
    }
}

const GameData = new GameDataRecorder();

export default GameData;