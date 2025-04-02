import { useState, useEffect } from 'react';
import { Box, IconButton, Paper, Menu, MenuItem, Switch, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import AddIcon from '@mui/icons-material/Add';
import { Map_, MapInfo } from './GameData';
import SingleInput from './utils/SingleInput';
import Hint from './utils/uHint';
import DraggableList from './utils/DraggableList';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface MapEditorProps {
    root: string;
    mapsInfo: MapInfo[];
    mapRecord: Map<string, Map<string, Map_>>;
}

function MapEditor({ root, mapsInfo, mapRecord }: MapEditorProps) {
    const [regions, setRegions] = useState<string[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [selectedMap, setSelectedMap] = useState<string | null>(null);
    const [newRegionName, setNewRegionName] = useState('');
    const [newMapName, setNewMapName] = useState('');
    const [newRegionDialog, setNewRegionDialog] = useState(false);
    const [newMapDialog, setNewMapDialog] = useState(false);
    const [targetRegionMaps, setTargetRegionMaps] = useState<Array<{id: string; label: string}>>([]);
    const [isEventMode, setIsEventMode] = useState(true);
    const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
    const [newLayerName, setNewLayerName] = useState('');
    const [newLayerDialog, setNewLayerDialog] = useState(false);
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
            bgm_volume: 100,
            bgs: '',
            bgs_volume: 100,
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

            console.log(targetMap);

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

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            <Paper sx={{ width: 300, p: 2, overflow: 'auto' }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography>绘制模式</Typography>
                        <Switch
                            checked={isEventMode}
                            onChange={(e) => setIsEventMode(e.target.checked)}
                        />
                        <Typography>事件模式</Typography>
                    </Box>

                    <Paper sx={{ width: 300, mt: 2, maxHeight: '10vh', overflow: 'auto' }}>
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
                                                                onClick={() => setSelectedLayer(selectedLayer === index ? null : index)}
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
            )}
            <SingleInput
                label="新建图层"
                inputType="图层名称"
                dialogOpen={newLayerDialog}
                handleOnClose={() => setNewLayerDialog(false)}
                content={newLayerName}
                handleOnChange={(e) => setNewLayerName(e.target.value)}
                handleSave={handleCreateLayer}
            />
        </Box>
    );
}

export default MapEditor;