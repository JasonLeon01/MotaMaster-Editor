import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, IconButton, Paper, Menu, MenuItem, Switch, List, ListItem, ListItemButton, ListItemText, Typography, Button, TextField, Tab, Tabs } from '@mui/material';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GameData, { Event, Map_, MapInfo, Tilemap } from './GameData';
import SingleInput from './utils/SingleInput';
import Hint from './utils/uHint';
import DraggableList from './utils/DraggableList';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FileSelector from 'utils/FileSelector';
import ForceGraph from 'utils/ForceGraph';

interface MapEditorProps {
    root: string;
    mapsInfo: MapInfo[];
    mapRecord: Map<string, Map<string, Map_>>;
    cellSize: number;
}

function MapEditor({ root, mapsInfo, mapRecord, cellSize }: MapEditorProps) {
    const [regions, setRegions] = useState<string[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [selectedMap, setSelectedMap] = useState<string | null>(null);
    const [newRegionName, setNewRegionName] = useState('');
    const [newMapName, setNewMapName] = useState('');
    const [newRegionDialog, setNewRegionDialog] = useState(false);
    const [newMapDialog, setNewMapDialog] = useState(false);
    const [targetRegionMaps, setTargetRegionMaps] = useState<Array<{id: string; label: string}>>([]);
    const [isEventMode, setIsEventMode] = useState(false);
    const [imageCache, setImageCache] = useState<Map<number, HTMLImageElement>>(new Map());
    const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
    const [newLayerName, setNewLayerName] = useState('');
    const [newLayerDialog, setNewLayerDialog] = useState(false);
    const [showFileSelector, setShowFileSelector] = useState(false);
    const [mapPropertiesDialog, setMapPropertiesDialog] = useState(false);
    const [tempMapProperties, setTempMapProperties] = useState<{
        name: string;
        description: string;
        width: number;
        height: number;
        bgm: string;
        bgs: string;
    } | null>(null);
    const [currentPath, setCurrentPath] = useState("");
    const [currentAudioType, setCurrentAudioType] = useState<"bgm" | "bgs" | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scale, setScale] = useState(1);
    const [tilemaps, setTilemaps] = useState<Tilemap[]>([]);
    const [selectedTilemap, setSelectedTilemap] = useState<number>(1);
    const [selectedTileId, setSelectedTileId] = useState<number>(0);
    const [tilemapImage, setTilemapImage] = useState<HTMLImageElement | null>(null);
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        severity: 'success' | 'info' | 'warning' | 'error';
        message: string;
    }>({ open: false, severity: 'info', message: '' });
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        itemId: string;
    } | null>(null);
    const [reorderDialog, setReorderDialog] = useState(false);
    const [updateTrigger, setUpdateTrigger] = useState(0);

    useEffect(() => {
        const regions = mapsInfo.map(info => info.region);
        setRegions(regions);
    }, []);

    useEffect(() => {
        setSelectedLayer(null);
    }, [selectedMap]);

    const handleAddRegion = () => {
        setNewRegionName('');
        setNewRegionDialog(true);
    };

    useEffect(() => {
        const allTilemaps = GameData.getAllTilemapInfo();
        setTilemaps(allTilemaps);
    }, []);

    useEffect(() => {
        if (isEventMode) {
            setSelectedTileId(0);
        }
    }, [isEventMode]);

    const handleCreateRegion = () => {
        if (!newRegionName.trim()) {
            setSnackbar({
                open: true,
                severity:'error',
                message: '区域名称不能为空',
            });
            return;
        }
        if (regions.includes(newRegionName)) {
            setSnackbar({
                open: true,
                severity:'error',
                message: '区域名称已存在',
            });
            return;
        }
        mapRecord.set(newRegionName, new Map());
        mapsInfo.push({
            region: newRegionName,
            data: [],
        });
        setRegions([...regions, newRegionName]);
        setNewRegionDialog(false);
        setSnackbar({
            open: true,
            severity:'success',
            message: `已添加区域：${newRegionName}`,
        });
    }

    const handleAddMap = () => {
        setNewMapName('');
        setNewMapDialog(true);
    };

    const handleCreateMap = () => {
        if (!newMapName.trim()) {
            setSnackbar({
                open: true,
                severity:'error',
                message: '地图名称不能为空',
            });
            return;
        }
        if (selectedRegion === null) {
            setSnackbar({
                open: true,
                severity:'error',
                message: '请选择区域',
            });
            return;
        }
        const regionMaps = mapRecord.get(selectedRegion);
        if (regionMaps === undefined) return;
        if (regionMaps.has(newMapName)) {
            setSnackbar({
                open: true,
                severity:'error',
                message: '地图文件已存在',
            });
            return;
        }
        const map: Map_ = {
            filename: newMapName,
            name: newMapName,
            description: '',
            region: selectedRegion,
            width: 11,
            height: 11,
            bgm: '',
            bgs: '',
            layers: []
        };
        regionMaps.set(newMapName, map);
        mapsInfo.forEach(info => {
            if (info.region === selectedRegion) {
                info.data.push(map);
            }
        });
        setNewMapDialog(false);
        setSnackbar({
            open: true,
            severity:'success',
            message: `已添加地图：${newMapName}`,
        });
    }

    const handleContextMenu = (event: React.MouseEvent, itemId: string) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({
            mouseX: event.clientX,
            mouseY: event.clientY,
            itemId,
        });
    };

    const handleContextMenuClose = () => {
        setContextMenu(null);
    };

    const handleDeleteItem = () => {
        if (!contextMenu) return;
        const [region, map] = contextMenu.itemId.split('#');
        if (map) {
            setSnackbar({
                open: true,
                severity: 'success',
                message: `已删除地图：${map}`,
            });
        } else {
            setSnackbar({
                open: true,
                severity: 'success',
                message: `已删除区域：${region}`,
            });
        }
        handleContextMenuClose();
    };

    const handleReorderConfirm = (newOrder: Array<{id: string; label: string}>) => {
        if (!selectedRegion) return;

        const regionMaps = mapRecord.get(selectedRegion);
        if (!regionMaps) return;

        const index = mapsInfo.findIndex(info => info.region === selectedRegion);
        if (index === -1) return;

        newOrder.forEach((item, idx)=> {
            const filename = item.id;
            if (filename) {
                const mapData = regionMaps.get(filename);
                if (mapData) {
                    mapsInfo[index].data[idx] = mapData;
                }
            }
        })

        setSnackbar({
            open: true,
            severity: 'success',
            message: '地图顺序已更新',
        });
    };

    const handleAddLayer = () => {
        setNewLayerName('');
        setNewLayerDialog(true);
    };

    const handleCreateLayer = () => {
        if (!selectedRegion || !selectedMap) return;
        if (!newLayerName.trim()) {
            setSnackbar({
                open: true,
                severity: 'error',
                message: '图层名称不能为空'
            });
            return;
        }

        const targetMap = mapsInfo
            .find(info => info.region === selectedRegion)
            ?.data.find(map => map.name === selectedMap);

        if (targetMap) {
            targetMap.layers.push({
                name: newLayerName,
                tilemap: 1,
                tiles: Array.from({ length: targetMap.width }, () => Array.from({ length: targetMap.height }, () => 0)),
                events: {}
            });

            setNewLayerDialog(false);
            setSnackbar({
                open: true,
                severity: 'success',
                message: '已添加新图层'
            });
        }
    };

    const handleLayerDragEnd = (result: any) => {
        if (!result.destination || !selectedRegion || !selectedMap) return;

        const targetMap = mapsInfo
            .find(info => info.region === selectedRegion)
            ?.data.find(map => map.name === selectedMap);

        if (targetMap) {
            const newLayers = Array.from(targetMap.layers);
            const [movedLayer] = newLayers.splice(result.source.index, 1);
            newLayers.splice(result.destination.index, 0, movedLayer);
            targetMap.layers = newLayers;
        }
    };

    const handleOpenFileSelector = (type: "bgm" | "bgs") => {
        setCurrentPath(`${root}/assets/musics`);
        setCurrentAudioType(type);
        setShowFileSelector(true);
    };

    const handleFileSelection = (files: string[]) => {
        if (!currentAudioType || files.length === 0) return;

        setTempMapProperties(prev => prev ? {
            ...prev,
            [currentAudioType]: files[0]
        } : null);

        setShowFileSelector(false);
    };

    const handleOpenMapProperties = () => {
        if (!selectedRegion || !selectedMap) return;
        const targetMap = mapsInfo
            .find(info => info.region === selectedRegion)
            ?.data.find(map => map.name === selectedMap);

        if (targetMap) {
            setTempMapProperties({
                name: targetMap.name,
                description: targetMap.description,
                width: targetMap.width,
                height: targetMap.height,
                bgm: targetMap.bgm,
                bgs: targetMap.bgs
            });
            setMapPropertiesDialog(true);
        }
    };

    const handleSaveMapProperties = () => {
        if (!selectedRegion || !selectedMap || !tempMapProperties) return;

        if (!tempMapProperties.name.trim()) {
            setSnackbar({
                open: true,
                severity: 'error',
                message: '地图名称不能为空'
            });
            return;
        }

        if (tempMapProperties.width < 1 || tempMapProperties.height < 1) {
            setSnackbar({
                open: true,
                severity: 'error',
                message: '地图尺寸必须大于0'
            });
            return;
        }

        if (tempMapProperties.width > 100 || tempMapProperties.height > 100) {
            setSnackbar({
                open: true,
                severity: 'error',
                message: '地图尺寸不能超过100'
            });
            return;
        }

        const targetMap = mapsInfo
            .find(info => info.region === selectedRegion)
            ?.data.find(map => map.name === selectedMap);

        if (targetMap) {
            targetMap.name = tempMapProperties.name;
            targetMap.description = tempMapProperties.description;
            targetMap.width = tempMapProperties.width;
            targetMap.height = tempMapProperties.height;
            targetMap.bgm = tempMapProperties.bgm;
            targetMap.bgs = tempMapProperties.bgs;

            targetMap.layers.forEach(layer => {
                const newTiles: number[][] = [];
                for (let y = 0; y < tempMapProperties.height; y++) {
                    const row: number[] = [];
                    for (let x = 0; x < tempMapProperties.width; x++) {
                        row.push(y < layer.tiles.length && x < layer.tiles[y].length ? layer.tiles[y][x] : 0);
                    }
                    newTiles.push(row);
                }
                layer.tiles = newTiles;
            });

            setSelectedMap(tempMapProperties.name);
            drawMap();
            setUpdateTrigger(prev => prev + 1);
            setMapPropertiesDialog(false);

            setSnackbar({
                open: true,
                severity: 'success',
                message: '地图属性已更新'
            });
        }
    };

    const convertToTreeItems = (regions: string[]): TreeViewBaseItem[] => {
        const treeItems: TreeViewBaseItem[] = [];
        regions.forEach(region => {
            const regionItem: TreeViewBaseItem = {
                id: region,
                label: region,
                children: [],
            };
            mapsInfo.forEach(info => {
                if (info.region === region) {
                    info.data.forEach(map => {
                        const mapItem: TreeViewBaseItem = {
                            id: `${region}#${map.name}`,
                            label: map.name,
                            children: [],
                        };
                        regionItem.children?.push(mapItem);
                    });
                }
            });
            treeItems.push(regionItem);
        });
        return treeItems;
    };

    const drawMap = useCallback(() => {
        if (!selectedRegion || !selectedMap || !canvasRef.current) return;

        const targetMap = mapsInfo
            .find(info => info.region === selectedRegion)
            ?.data.find(map => map.name === selectedMap);

        if (!targetMap) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (canvas.width !== targetMap.width * cellSize || canvas.height !== targetMap.height * cellSize) {
            canvas.width = targetMap.width * cellSize;
            canvas.height = targetMap.height * cellSize;
        }

        const drawBackground = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const gridSize = cellSize / 2;
            for (let y = 0; y < canvas.height; y += gridSize) {
                for (let x = 0; x < canvas.width; x += gridSize) {
                    if ((x / gridSize + y / gridSize) % 2 === 0) {
                        ctx.fillStyle = '#f0f0f0';
                    } else {
                        ctx.fillStyle = '#ffffff';
                    }
                    ctx.fillRect(x, y, gridSize, gridSize);
                }
            }
        };

        const loadImage = async (tilemapId: number): Promise<HTMLImageElement | null> => {
            if (imageCache.has(tilemapId)) {
                return imageCache.get(tilemapId)!;
            }

            const tilemap = GameData.getTilemapInfo(tilemapId);
            if (!tilemap) return null;

            return new Promise<HTMLImageElement>((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = `file://${root}/assets/tilesets/${tilemap.file}`;
                img.onload = () => {
                    setImageCache(prev => new Map(prev).set(tilemapId, img));
                    resolve(img);
                };
                img.onerror = () => {
                    console.error('Failed to load image:', tilemap.file);
                    const emptyImg = new Image();
                    resolve(emptyImg);
                };
            });
        };

        const renderLayers = async () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const layerImages = await Promise.all(
                targetMap.layers.map(layer => loadImage(layer.tilemap))
            );
            drawBackground();
            targetMap.layers.forEach((layer, idx) => {
                const img = layerImages[idx];
                if (!img) return;

                ctx.globalAlpha = selectedLayer !== null ? (idx === selectedLayer ? 1 : 0.5) : 1;

                for (let y = 0; y < targetMap.height; y++) {
                    for (let x = 0; x < targetMap.width; x++) {
                        const tileId = layer.tiles[y][x];
                        if (tileId === 0) continue;

                        const srcX = (tileId % 8) * cellSize;
                        const srcY = Math.floor(tileId / 8) * cellSize;

                        ctx.drawImage(
                            img,
                            srcX,
                            srcY,
                            cellSize,
                            cellSize,
                            x * cellSize,
                            y * cellSize,
                            cellSize,
                            cellSize
                        );
                    }
                }
            });
            ctx.globalAlpha = 1;
        };
        renderLayers();

    }, [selectedRegion, selectedMap, mapsInfo, cellSize, root, selectedLayer]);

    const drawPreview = useCallback(() => {
        if (!selectedRegion || !selectedMap || !previewCanvasRef.current || !mousePosition || isEventMode || selectedTileId === null) return;

        const targetMap = mapsInfo
            .find(info => info.region === selectedRegion)
            ?.data.find(map => map.name === selectedMap);

        if (!targetMap) return;

        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { x, y } = mousePosition;
        if (x < 0 || x >= targetMap.width || y < 0 || y >= targetMap.height) return;

        if (selectedLayer === null) return;

        if (selectedTileId === 0) {
            const gridSize = cellSize / 2;
            ctx.globalAlpha = 0.5;

            for (let i = 0; i < cellSize; i += gridSize) {
                for (let j = 0; j < cellSize; j += gridSize) {
                    if ((i / gridSize + j / gridSize) % 2 === 0) {
                        ctx.fillStyle = '#ffffff';
                    } else {
                        ctx.fillStyle = '#cccccc';
                    }
                    ctx.fillRect(
                        x * cellSize + i,
                        y * cellSize + j,
                        gridSize,
                        gridSize
                    );
                }
            }

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

            ctx.globalAlpha = 1;
            return;
        }

        const img = imageCache.get(selectedTilemap);
        if (!img) return;

        ctx.globalAlpha = 0.5;
        const srcX = (selectedTileId % 8) * cellSize;
        const srcY = Math.floor(selectedTileId / 8) * cellSize;
        ctx.drawImage(
            img,
            srcX,
            srcY,
            cellSize,
            cellSize,
            x * cellSize,
            y * cellSize,
            cellSize,
            cellSize
        );
        ctx.globalAlpha = 1;
    }, [selectedRegion, selectedMap, mousePosition, isEventMode, selectedTileId, selectedLayer, selectedTilemap, cellSize, mapsInfo, imageCache]);

    useEffect(() => {
        drawMap();
    }, [drawMap, selectedLayer]);

    const loadTilemapImage = useCallback((tilemapId: number) => {
        const tilemap = GameData.getTilemapInfo(tilemapId);
        if (!tilemap) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = `file://${root}/assets/tilesets/${tilemap.file}`;
        img.onload = () => setTilemapImage(img);
    }, [root]);

    useEffect(() => {
        loadTilemapImage(selectedTilemap);
    }, [selectedTilemap, loadTilemapImage]);

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            <Box sx={{display: 'flex', maxHeight: '65vh', width: '100%'}}>
                <Paper sx={{ width: '15vh', p: 2, overflow: 'auto' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <h3>地图编辑器</h3>
                        <IconButton onClick={handleAddRegion}>
                            <AddIcon />
                        </IconButton>
                    </Box>

                    <RichTreeView multiSelect
                        items={convertToTreeItems(regions)}
                        onItemClick={(event, itemId) => {
                            const [region, map] = itemId.split('#');
                            if (map) {
                                setSelectedRegion(region);
                                setSelectedMap(map);
                            } else {
                                setSelectedRegion(region);
                                setSelectedMap(null);
                            }
                        }}
                        onContextMenu={(event) => {
                            const itemId = selectedMap ? '' : (selectedRegion ?? '');
                            handleContextMenu(event, itemId);
                        }}
                    />

                    <Menu
                        open={!!contextMenu}
                        onClose={handleContextMenuClose}
                        anchorReference="anchorPosition"
                        anchorPosition={
                            contextMenu
                                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                                : undefined
                        }
                    >
                        {contextMenu && selectedMap != null && (
                            <MenuItem onClick={() => {
                                handleOpenMapProperties();
                                handleContextMenuClose();
                            }}>
                                编辑属性
                            </MenuItem>
                        )}
                        {contextMenu && contextMenu.itemId != '' && (
                            <MenuItem onClick={() => {
                                handleAddMap();
                                handleContextMenuClose();
                            }}>
                                添加地图
                            </MenuItem>
                        )}
                        {contextMenu && contextMenu.itemId != '' && (
                            <MenuItem onClick={() => {
                                const [region] = contextMenu.itemId.split('#');

                                const maps = mapsInfo.find(info => info.region === region)?.data.map(map => ({
                                    id: map.filename,
                                    label: `${map.filename}: ${map.name}`
                                })) ?? [];

                                setTargetRegionMaps(maps);
                                setReorderDialog(true);
                                handleContextMenuClose();
                            }}>
                                调整顺序
                            </MenuItem>
                        )}
                        <MenuItem onClick={handleDeleteItem}>删除</MenuItem>
                    </Menu>

                    <SingleInput
                        label="新建区域"
                        inputType="区域名称"
                        dialogOpen={newRegionDialog}
                        handleOnClose={() => {
                            setNewRegionDialog(false);
                        }}
                        content={newRegionName}
                        handleOnChange={(e) => setNewRegionName(e.target.value)}
                        handleSave={handleCreateRegion}
                        />

                    <SingleInput
                        label="新建地图"
                        inputType="地图文件名"
                        dialogOpen={newMapDialog}
                        handleOnClose={() => {
                            setNewMapDialog(false);
                        }}
                        content={newMapName}
                        handleOnChange={(e) => setNewMapName(e.target.value)}
                        handleSave={handleCreateMap}
                        />

                    <Hint
                        snackbar={snackbar}
                        handleOnClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                        />

                    <DraggableList
                        items={targetRegionMaps}
                        open={reorderDialog}
                        title="调整地图顺序"
                        onClose={() => setReorderDialog(false)}
                        onConfirm={handleReorderConfirm}
                        />
                </Paper>

                {selectedMap && (
                    <Box sx={{ flex: 1, p: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2, width: '50vh' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                                        <Typography>绘制模式</Typography>
                                        <Switch
                                            checked={isEventMode}
                                            onChange={(e) => setIsEventMode(e.target.checked)}
                                        />
                                        <Typography>事件模式</Typography>
                                    </Box>

                                    <Paper sx={{ flex: 1, height: '15vh', overflow: 'auto' }}>
                                        <List>
                                            <ListItem
                                                secondaryAction={
                                                    <IconButton edge="end" onClick={handleAddLayer}>
                                                        <AddIcon />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemText primary="图层列表" />
                                            </ListItem>
                                            <DragDropContext onDragEnd={handleLayerDragEnd}>
                                                <Droppable droppableId="layer-list">
                                                    {(provided) => (
                                                        <div {...provided.droppableProps} ref={provided.innerRef}>
                                                            {mapsInfo
                                                                .find(info => info.region === selectedRegion)
                                                                ?.data.find(map => map.name === selectedMap)
                                                                ?.layers.map((layer, index) => (
                                                                    <Draggable
                                                                        key={index}
                                                                        draggableId={`layer-${index}`}
                                                                        index={index}
                                                                    >
                                                                        {(provided) => (
                                                                            <ListItemButton
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                selected={selectedLayer === index}
                                                                                onClick={() => {
                                                                                    setSelectedLayer(selectedLayer === index ? null : index);
                                                                                    const layer = mapsInfo
                                                                                    .find(info => info.region === selectedRegion)
                                                                                    ?.data.find(map => map.name === selectedMap)
                                                                                    ?.layers[index];
                                                                                    if (layer) {
                                                                                        setSelectedTilemap(layer.tilemap);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Box {...provided.dragHandleProps} sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                                                                    <DragIndicatorIcon />
                                                                                </Box>
                                                                                <ListItemText primary={layer.name || `图层 ${index + 1}`} />
                                                                            </ListItemButton>
                                                                        )}
                                                                    </Draggable>
                                                                ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </DragDropContext>
                                        </List>
                                    </Paper>
                                </Box>

                                <Paper sx={{
                                    width: '45vh',
                                    mt: 2,
                                    height: '45vh',
                                    overflow: 'auto',
                                    backgroundColor: '#e0e0e0'
                                }}>
                                    <Box
                                        sx={{ position: 'relative' }}
                                        onWheel={(e) => {
                                            if (e.ctrlKey || e.metaKey) {
                                                e.preventDefault();
                                                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                                                setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
                                            }
                                        }}
                                    >
                                        <canvas
                                            ref={canvasRef}
                                            style={{
                                                display: 'block',
                                                transform: `scale(${scale})`,
                                                transformOrigin: 'top left'
                                            }}
                                            width={(selectedMap ? (mapsInfo
                                                ?.find(info => info.region === selectedRegion)
                                                ?.data.find(map => map.name === selectedMap)
                                                ?.width ?? 0) * cellSize : 0)
                                            }
                                            height={(selectedMap ? (mapsInfo
                                                ?.find(info => info.region === selectedRegion)
                                                ?.data.find(map => map.name === selectedMap)
                                                ?.height ?? 0) * cellSize : 0)
                                            }
                                            onMouseDown={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const x = Math.floor((e.clientX - rect.left) / (cellSize * scale));
                                                const y = Math.floor((e.clientY - rect.top) / (cellSize * scale));
                                                if (e.button === 0) {
                                                    if (isEventMode) {

                                                    }
                                                    else {
                                                        if (selectedLayer !== null && selectedTileId !== null && selectedRegion && selectedMap) {
                                                            const targetMap = mapsInfo
                                                            .find(info => info.region === selectedRegion)
                                                            ?.data.find(map => map.name === selectedMap);
                                                            if (targetMap && x >= 0 && x < targetMap.width && y >= 0 && y < targetMap.height) {
                                                                targetMap.layers[selectedLayer].tiles[y][x] = selectedTileId;
                                                                drawMap();
                                                            }
                                                        }
                                                    }
                                                }
                                                else if (e.button === 2) {
                                                    if (isEventMode) {

                                                    }
                                                    else {
                                                        e.preventDefault();
                                                        const targetMap = mapsInfo
                                                            .find(info => info.region === selectedRegion)
                                                            ?.data.find(map => map.name === selectedMap);

                                                        if (targetMap && selectedLayer !== null && x >= 0 && x < targetMap.width && y >= 0 && y < targetMap.height) {
                                                            const tileId = targetMap.layers[selectedLayer].tiles[y][x];
                                                            setSelectedTileId(tileId);
                                                        }
                                                    }
                                                }
                                            }}
                                            onMouseMove={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const x = Math.floor((e.clientX - rect.left) / (cellSize * scale));
                                                const y = Math.floor((e.clientY - rect.top) / (cellSize * scale));

                                                setMousePosition({ x, y });
                                                drawPreview();

                                                if (e.buttons === 1 && selectedLayer !== null && selectedTileId !== null) {
                                                    if (isEventMode) {

                                                    }
                                                    else {
                                                        const targetMap = mapsInfo
                                                            .find(info => info.region === selectedRegion)
                                                            ?.data.find(map => map.name === selectedMap);

                                                        if (targetMap && x >= 0 && x < targetMap.width && y >= 0 && y < targetMap.height) {
                                                            targetMap.layers[selectedLayer].tiles[y][x] = selectedTileId;
                                                            drawMap();
                                                        }
                                                    }
                                                }
                                            }}
                                            onMouseLeave={() => {
                                                setMousePosition(null);
                                                if (previewCanvasRef.current) {
                                                    const ctx = previewCanvasRef.current.getContext('2d');
                                                    if (ctx) {
                                                        ctx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
                                                    }
                                                }
                                            }}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                            }}
                                        />

                                        <canvas
                                            ref={previewCanvasRef}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                pointerEvents: 'none',
                                                transform: `scale(${scale})`,
                                                transformOrigin: 'top left'
                                            }}
                                            width={(selectedMap ? (mapsInfo
                                                ?.find(info => info.region === selectedRegion)
                                                ?.data.find(map => map.name === selectedMap)
                                                ?.width ?? 0) * cellSize : 0)
                                            }
                                            height={(selectedMap ? (mapsInfo
                                                ?.find(info => info.region === selectedRegion)
                                                ?.data.find(map => map.name === selectedMap)
                                                ?.height ?? 0) * cellSize : 0)
                                            }
                                        />
                                    </Box>
                                </Paper>
                            </Box>

                            <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                {!isEventMode &&
                                    <Box
                                        sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setSelectedTileId(0);
                                        }}
                                    >
                                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                            <Tabs
                                                value={selectedTilemap}
                                                onChange={(_, value) => {
                                                    setSelectedTilemap(value);
                                                    if (selectedLayer !== null && selectedRegion && selectedMap) {
                                                        const targetMap = mapsInfo
                                                            .find(info => info.region === selectedRegion)
                                                            ?.data.find(map => map.name === selectedMap);

                                                        if (targetMap && targetMap.layers[selectedLayer]) {
                                                            targetMap.layers[selectedLayer].tilemap = value;
                                                            drawMap();
                                                        }
                                                    }
                                                }}
                                            >
                                                {tilemaps.map((tilemap) => (
                                                    <Tab
                                                        key={tilemap.id}
                                                        label={tilemap.name}
                                                        value={tilemap.id}
                                                    />
                                                ))}
                                            </Tabs>
                                        </Box>

                                        <Box sx={{
                                            flex: 1,
                                            overflow: 'auto',
                                            p: 1,
                                            display: 'grid',
                                            gridTemplateColumns: `repeat(8, ${cellSize}px)`,
                                            gap: 1,
                                            justifyContent: 'center'
                                        }}>
                                            {tilemapImage && Array.from(
                                                { length: Math.floor((tilemapImage.height / cellSize) * 8) },
                                                (_, i) => (
                                                    <Box
                                                        key={i}
                                                        sx={{
                                                            width: cellSize,
                                                            height: cellSize,
                                                            border: selectedTileId === (i + 1) ? '2px solid #1976d2' : '1px solid #ccc',
                                                            cursor: 'pointer',
                                                            backgroundImage: `url(${tilemapImage.src})`,
                                                            backgroundPosition: `-${((i + 1) % 8) * cellSize}px -${Math.floor((i + 1) / 8) * cellSize}px`,
                                                            '&:hover': {
                                                                border: '2px solid #1976d2'
                                                            }
                                                        }}
                                                        onClick={() => setSelectedTileId(i + 1)}
                                                    />
                                                )
                                            )}
                                        </Box>
                                    </Box>
                                }
                                {isEventMode &&
                                    <Box
                                        sx={{
                                            flex: 1,
                                            height: '100%',
                                            border: '1px solid #ccc',
                                            overflow: 'hidden'
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    >
                                        <ForceGraph
                                            root={root}
                                            event={selectedEvent}
                                        />
                                    </Box>
                                }
                            </Paper>
                        </Box>
                    </Box>
                )}
            </Box>
            <SingleInput
                label="新建图层"
                inputType="图层名称"
                dialogOpen={newLayerDialog}
                handleOnClose={() => setNewLayerDialog(false)}
                content={newLayerName}
                handleOnChange={(e) => setNewLayerName(e.target.value)}
                handleSave={handleCreateLayer}
            />
            <FileSelector
                open={showFileSelector}
                onClose={() => setShowFileSelector(false)}
                path={currentPath}
                onSelect={handleFileSelection}
                multiple={false}
            />

            <Dialog open={mapPropertiesDialog} onClose={() => setMapPropertiesDialog(false)}>
                <DialogTitle>地图属性</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, minWidth: 400 }}>
                        <TextField
                            label="地图名称"
                            fullWidth
                            value={tempMapProperties?.name ?? ''}
                            onChange={(e) => setTempMapProperties(prev => prev ? { ...prev, name: e.target.value } : null)}
                        />
                        <TextField
                            label="地图介绍"
                            fullWidth
                            multiline
                            rows={3}
                            value={tempMapProperties?.description ?? ''}
                            onChange={(e) => setTempMapProperties(prev => prev ? { ...prev, description: e.target.value } : null)}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="宽度"
                                type="number"
                                value={tempMapProperties?.width ?? ''}
                                onChange={(e) => setTempMapProperties(prev => prev ? { ...prev, width: parseInt(e.target.value) || 0 } : null)}
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                label="高度"
                                type="number"
                                value={tempMapProperties?.height ?? ''}
                                onChange={(e) => setTempMapProperties(prev => prev ? { ...prev, height: parseInt(e.target.value) || 0 } : null)}
                                sx={{ flex: 1 }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                label="背景音乐"
                                fullWidth
                                value={tempMapProperties?.bgm ?? ''}
                                disabled
                            />
                            <Button variant="contained" onClick={() => handleOpenFileSelector('bgm')}>...</Button>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                label="背景音效"
                                fullWidth
                                value={tempMapProperties?.bgs ?? ''}
                                disabled
                            />
                            <Button variant="contained" onClick={() => handleOpenFileSelector('bgs')}>...</Button>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMapPropertiesDialog(false)}>取消</Button>
                    <Button onClick={handleSaveMapProperties} variant="contained">确定</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}

export default MapEditor;