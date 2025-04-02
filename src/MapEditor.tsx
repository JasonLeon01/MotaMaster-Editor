import { useState, useEffect } from 'react';
import { Box, IconButton, Paper, Menu, MenuItem } from '@mui/material';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import GameData, { Map_, MapInfo } from './GameData';
import SingleInput from './utils/SingleInput';
import Hint from './utils/uHint';

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

    useEffect(() => {
        const regions = mapsInfo.map(info => info.region);
        setRegions(regions);
    }, []);

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
        setSelectedMap(newMapName);
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
        const [region, map] = contextMenu.itemId.split('-');
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

    const handleDragEnd = (result: any) => {
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
                            id: `${region}-${map.name}`,
                            label: map.name,
                            children: [],
                        };
                        regionItem.children?.push(mapItem);
                    });
                }
            })
            treeItems.push(regionItem);
        })
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

                <RichTreeView
                    items={convertToTreeItems(regions)}
                    onItemClick={(event, itemId) => {
                        const [region, map] = itemId.split('-');
                        if (map) {
                            setSelectedRegion(region);
                            setSelectedMap(map);
                        } else {
                            setSelectedRegion(region);
                            setSelectedMap(null);
                        }
                    }}
                    onContextMenu={(event) => {
                        const target = event.target as HTMLElement;
                        const itemId = target.closest('[role="treeitem"]')?.getAttribute('data-id') || '';
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
                    {contextMenu && !contextMenu.itemId.includes('-') && (
                        <MenuItem onClick={() => {
                            handleAddMap();
                            handleContextMenuClose();
                        }}>
                            添加地图
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
            </Paper>
        </Box>
    );
}

export default MapEditor;