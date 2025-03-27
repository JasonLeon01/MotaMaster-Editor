import { useState } from 'react';
import { Box, List, ListItemButton, ListItemText, TextField, Button, Radio, RadioGroup, FormControlLabel, IconButton, Paper } from '@mui/material';
import GameData, { Tilemap } from './GameData';
import FileSelector from './utils/FileSelector';
import SingleInput from './utils/SingleInput';
import MultiSwitchInput from './utils/MultiSwitchInput';
import { Cancel, CheckCircle, ArrowUpward, ArrowDownward, ArrowBack, ArrowForward, FiberManualRecord } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Hint from 'utils/uHint';

const path = window.require('path');

interface TilemapEditorProps {
    tilemaps: Tilemap[];
    root: string;
}

type EditMode = 'walkable' | 'collision' | 'event';

function TilemapEditor({ tilemaps, root }: TilemapEditorProps) {
    const [selectedTilemap, setSelectedTilemap] = useState<Tilemap | null>(null);
    const [newTilemapDialog, setNewTilemapDialog] = useState(false);
    const [newTilemapName, setNewTilemapName] = useState('');
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [editMode, setEditMode] = useState<EditMode>('walkable');
    const [fileSelector, setFileSelector] = useState({
        open: false,
        path: ''
    });
    const [directionDialog, setDirectionDialog] = useState({
        open: false,
        x: 0,
        y: 0,
        directions: [
            { label: '上', value: true },
            { label: '下', value: true },
            { label: '左', value: true },
            { label: '右', value: true }
        ]
    });
    const [eventDialog, setEventDialog] = useState({
        open: false,
        x: 0,
        y: 0,
        eventId: '0'
    });
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        severity: 'success' | 'info' | 'warning' | 'error';
        message: string;
    }>({ open: false, severity: 'warning', message: '' });


    const handleAddTilemap = () => {
        setNewTilemapName('');
        setNewTilemapDialog(true);
    };

    const handleCreateTilemap = () => {
        if (!newTilemapName.trim()) return;

        const newId = tilemaps.length;
        const newTilemap = {
            id: newId,
            name: newTilemapName,
            file: '',
            walkable: [],
            collisionFlags: [],
            events: []
        };

        tilemaps.push(newTilemap);
        GameData.setTilemapInfo(newId, newTilemap);
        setSelectedTilemap(newTilemap);
        setNewTilemapDialog(false);
    };

    const handleDeleteTilemap = (tilemap: Tilemap, event: React.MouseEvent) => {
        event.stopPropagation();
        if (tilemaps.length === 2) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '至少保留一个图块'
            });
            return;
        }

        const tilemap_index = tilemaps.findIndex(i => i && i.id === tilemap.id);
        if (tilemap_index !== -1) {
            tilemaps.splice(tilemap_index, 1);
            for (let i = tilemap_index; i < tilemaps.length; i++) {
                tilemaps[i].id = i;
                GameData.setTilemapInfo(i, tilemaps[i]);
            }
            if (selectedTilemap?.id === tilemap.id) {
                setSelectedTilemap(tilemaps[0] || null);
            }
            setUpdateTrigger(prev => prev + 1);
        }
    };

    const handleSelectFile = () => {
        setFileSelector({
            open: true,
            path: path.join(root, 'assets', 'tilesets')
        });
    };

    const handleFileSelect = (files: string[]) => {
        if (!selectedTilemap || files.length === 0) return;

        const img = new Image();
        img.src = `file://${path.join(root, 'assets', 'tilesets', files[0])}`;
        img.onload = () => {
            const rows = Math.floor(img.height / 32);
            const cols = Math.floor(img.width / 32);

            const updated = {
                ...selectedTilemap,
                file: files[0],
                walkable: Array(rows).fill(true).map(() => Array(cols).fill(true)),
                collisionFlags: Array(rows).fill(null).map(() =>
                    Array(cols).fill(null).map(() => ({
                        up: true,
                        down: true,
                        left: true,
                        right: true
                    }))
                ),
                events: Array(rows).fill(0).map(() => Array(cols).fill(0))
            };

            tilemaps[updated.id] = updated;
            GameData.setTilemapInfo(updated.id, updated);
            setSelectedTilemap(updated);
        };
        setFileSelector(prev => ({ ...prev, open: false }));
        console.log(GameData.getTilemapInfo(1));
    };

    const handleCellClick = (x: number, y: number) => {
        if (!selectedTilemap) return;

        switch (editMode) {
            case 'walkable':
                const newWalkable = [...selectedTilemap.walkable];
                newWalkable[y][x] = !newWalkable[y][x];
                const updatedWalkable = {
                    ...selectedTilemap,
                    walkable: newWalkable
                };
                tilemaps[updatedWalkable.id] = updatedWalkable;
                GameData.setTilemapInfo(updatedWalkable.id, updatedWalkable);
                setSelectedTilemap(updatedWalkable);
                break;

            case 'collision':
                setDirectionDialog({
                    open: true,
                    x,
                    y,
                    directions: [
                        { label: '上', value: selectedTilemap.collisionFlags[y][x].up },
                        { label: '下', value: selectedTilemap.collisionFlags[y][x].down },
                        { label: '左', value: selectedTilemap.collisionFlags[y][x].left },
                        { label: '右', value: selectedTilemap.collisionFlags[y][x].right }
                    ]
                });
                break;

            case 'event':
                setEventDialog({
                    open: true,
                    x,
                    y,
                    eventId: selectedTilemap.events[y][x].toString()
                });
                break;
        }
    };

    const handleDirectionChange = (index: number, value: boolean) => {
        setDirectionDialog(prev => ({
            ...prev,
            directions: prev.directions.map((dir, i) =>
                i === index ? { ...dir, value } : dir
            )
        }));
    };

    const handleDirectionSave = () => {
        if (!selectedTilemap) return;

        const newCollisionFlags = [...selectedTilemap.collisionFlags];
        const { x, y, directions } = directionDialog;

        newCollisionFlags[y][x] = {
            up: directions[0].value,
            down: directions[1].value,
            left: directions[2].value,
            right: directions[3].value
        };

        const updated = {
            ...selectedTilemap,
            collisionFlags: newCollisionFlags
        };

        tilemaps[updated.id] = updated;
        GameData.setTilemapInfo(updated.id, updated);
        setSelectedTilemap(updated);
        setDirectionDialog(prev => ({ ...prev, open: false }));
    };

    const handleEventChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEventDialog(prev => ({
            ...prev,
            eventId: e.target.value
        }));
    };

    const handleEventSave = () => {
        if (!selectedTilemap) return;

        const newEvent = [...selectedTilemap.events];
        const { x, y, eventId } = eventDialog;
        newEvent[y][x] = parseInt(eventId) || 0;

        const updated = {
            ...selectedTilemap,
            events: newEvent
        };

        tilemaps[updated.id] = updated;
        GameData.setTilemapInfo(updated.id, updated);
        setSelectedTilemap(updated);
        setEventDialog(prev => ({ ...prev, open: false }));
    };

    const renderCell = (x: number, y: number) => {
        if (!selectedTilemap) return null;

        switch (editMode) {
            case 'walkable':
                return selectedTilemap.walkable[y][x] ?
                    <CheckCircle color="success" /> :
                    <Cancel color="error" />;

            case 'collision':
                const flags = selectedTilemap.collisionFlags[y][x];
                return (
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                        {flags.up && <ArrowUpward sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }} />}
                        {flags.down && <ArrowDownward sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }} />}
                        {flags.left && <ArrowBack sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }} />}
                        {flags.right && <ArrowForward sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }} />}
                        {(!flags.up && !flags.down && !flags.left && !flags.right) &&
                            <FiberManualRecord sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />}
                    </Box>
                );

            case 'event':
                return selectedTilemap.events[y][x] || '0';
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper sx={{ width: '200px', p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <h3 style={{ margin: 0 }}>瓦块地图</h3>
                    <IconButton
                        onClick={handleAddTilemap}
                        color="primary"
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
                <List>
                    {tilemaps.map(tilemap => (
                        <ListItemButton
                            key={tilemap.id}
                            selected={selectedTilemap?.id === tilemap.id}
                            onClick={() => setSelectedTilemap(tilemap)}
                        >
                            <ListItemText primary={`${tilemap.id}: ${tilemap.name}`} />
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    handleDeleteTilemap(tilemap, e);
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </ListItemButton>
                    ))}
                </List>
            </Paper>

            <Box sx={{ flex: 1, p: 2 }}>
                {selectedTilemap && (
                    <>
                        <TextField
                            label="瓦块地图名称"
                            value={selectedTilemap.name}
                            onChange={(e) => {
                                const updated = { ...selectedTilemap, name: e.target.value };
                                tilemaps[updated.id] = updated;
                                GameData.setTilemapInfo(updated.id, updated);
                                setSelectedTilemap(updated);
                            }}
                            fullWidth
                            sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <TextField
                                label="文件名"
                                value={selectedTilemap.file}
                                disabled
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                onClick={handleSelectFile}
                                sx={{ ml: 1 }}
                            >
                                ...
                            </Button>
                        </Box>

                        <RadioGroup
                            row
                            value={editMode}
                            onChange={(e) => setEditMode(e.target.value as EditMode)}
                            sx={{ mb: 2 }}
                        >
                            <FormControlLabel value="walkable" control={<Radio />} label="通行性编辑" />
                            <FormControlLabel value="collision" control={<Radio />} label="四方向编辑" />
                            <FormControlLabel value="event" control={<Radio />} label="行走事件编辑" />
                        </RadioGroup>

                        {selectedTilemap.file && (
                            <Box sx={{ position: 'relative', width: 'fit-content' }}>
                                <Box sx={{ position: 'relative' }}>
                                    <img
                                        src={`file://${path.join(root, 'assets', 'tilesets', selectedTilemap.file)}`}
                                        style={{ display: 'block' }}
                                    />
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${selectedTilemap.walkable[0].length}, 32px)`,
                                        gridTemplateRows: `repeat(${selectedTilemap.walkable.length}, 32px)`,
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                    }}>
                                        {selectedTilemap.walkable.map((row, y) =>
                                            row.map((_, x) => (
                                                <Box
                                                    key={`${x}-${y}`}
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        border: '1px solid rgba(255,255,255,0.3)',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                                        }
                                                    }}
                                                    onClick={() => handleCellClick(x, y)}
                                                >
                                                    {renderCell(x, y)}
                                                </Box>
                                            ))
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            <SingleInput
                label="新建瓦块地图"
                inputType="地图名称"
                dialogOpen={newTilemapDialog}
                handleOnClose={() => setNewTilemapDialog(false)}
                content={newTilemapName}
                handleOnChange={(e) => setNewTilemapName(e.target.value)}
                handleSave={handleCreateTilemap}
            />

            <FileSelector
                open={fileSelector.open}
                onClose={() => setFileSelector(prev => ({ ...prev, open: false }))}
                path={fileSelector.path}
                onSelect={handleFileSelect}
                multiple={false}
            />

            <MultiSwitchInput
                label='编辑四方向'
                dialogOpen={directionDialog.open}
                handleOnClose={() => setDirectionDialog(prev => ({ ...prev, open: false }))}
                lists={directionDialog.directions}
                handleOnChange={handleDirectionChange}
                handleSave={handleDirectionSave}
            />

            <SingleInput
                label="编辑事件"
                inputType="事件ID"
                dialogOpen={eventDialog.open}
                handleOnClose={() => setEventDialog(prev => ({ ...prev, open: false }))}
                content={eventDialog.eventId}
                handleOnChange={handleEventChange}
                handleSave={handleEventSave}
            />

            <Hint
                snackbar={snackbar}
                handleOnClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            />
        </Box>
    );
}

export default TilemapEditor;