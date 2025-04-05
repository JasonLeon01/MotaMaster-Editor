import { useState } from 'react';
import { Box, List, ListItemButton, ListItemText, Paper, TextField, Button, Grid2, IconButton, Menu, MenuItem } from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import GameData, { Enemy } from './GameData';
import Hint from './utils/uHint';
import FileSelector from './utils/FileSelector';
import DoubleInput from 'utils/DoubleInput';
import SingleInput from 'utils/SingleInput';
const path = window.require('path');

interface EnemyEditorProps {
    enemies: Enemy[];
    root: string;
}

function EnemyEditor({ enemies, root }: EnemyEditorProps) {
    const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);
    const [newEnemyDialog, setNewEnemyDialog] = useState(false);
    const [newEnemyName, setNewEnemyName] = useState('');
    const [imageWidth, setImageWidth] = useState(0);
    const [selectedCell, setSelectedCell] = useState<{x: number}>({x: 0});
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [editingField, setEditingField] = useState<{
        key: string,
        originalKey: string,
        value: number
    } | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dropDialogOpen, setDropDialogOpen] = useState(false);
    const [editingDrop, setEditingDrop] = useState<{
        key: string,
        originalKey: string,
        value: number
    } | null>(null);
    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{
        key: number,
        originalKey: number,
        value: number
    } | null>(null);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        severity: 'success' | 'info' | 'warning' | 'error';
        message: string;
    }>({ open: false, severity: 'warning', message: '' });
    const [fileSelector, setFileSelector] = useState({
        open: false,
        path: ''
    });
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        type: 'enemy' | 'attr' | 'drop' | 'item';
        id: number | string;
    } | null>(null);

    const handleAddEnemy = () => {
        setNewEnemyName('');
        setNewEnemyDialog(true);
    };

    const handleCreateEnemy = () => {
        if (!newEnemyName.trim()) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '敌人名称不能为空'
            });
            return;
        }

        const newId = enemies.length;
        const newEnemy: Enemy = {
            id: newId,
            name: newEnemyName,
            description: '',
            special: [],
            file: ['', 0],
            attr: [
                { key: 'hp', value: 0 },
                { key: 'atk', value: 0 },
                { key: 'def', value: 0 }
            ],
            drop: [
                { key: 'exp', value: 0 },
                { key: 'gold', value: 0 }
            ],
            items: []
        };

        enemies.push(newEnemy);
        GameData.setEnemyInfo(newId, newEnemy);
        setNewEnemyDialog(false);
        setSelectedEnemy(newEnemy);
    };

    const handleContextMenu = (event: React.MouseEvent, type: 'enemy' | 'attr' | 'drop' | 'item', id: number | string) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({
            mouseX: event.clientX,
            mouseY: event.clientY,
            type,
            id
        });
    };

    const handleContextMenuClose = () => {
        setContextMenu(null);
    };

    const handleDeleteFromMenu = () => {
        if (!contextMenu) return;

        switch (contextMenu.type) {
            case 'enemy':
                handleDeleteEnemy(enemies.find(e => e && e.id === contextMenu.id) as Enemy);
                break;
            case 'attr':
                handleDeleteAttr(contextMenu.id as string);
                break;
            case 'drop':
                handleDeleteDrop(contextMenu.id as string);
                break;
            case 'item':
                handleDeleteItem(contextMenu.id as number);
                break;
        }
        handleContextMenuClose();
    };

    const handleDeleteEnemy = (enemy: Enemy) => {
        if (enemies.length === 2) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '至少保留一个敌人'
            });
            return;
        }

        const enemy_index = enemies.findIndex(i => i && i.id === enemy.id);
        if (enemy_index !== -1) {
            enemies.splice(enemy_index, 1);
            for (let i = enemy_index; i < enemies.length; i++) {
                enemies[i].id = i;
                GameData.setEnemyInfo(i, enemies[i]);
            }
            if (selectedEnemy?.id === enemy.id) {
                setSelectedEnemy(enemies[0] || null);
            }
            setUpdateTrigger(prev => prev + 1);
        }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = Math.floor((e.clientY - rect.top) / 32);
        handleCellSelect(y);
    };

    const handleCellSelect = (y: number) => {
        if (!selectedEnemy) return;

        const updated = {
            ...selectedEnemy,
            file: [selectedEnemy.file[0], y] as [string, number]
        };
        enemies[updated.id] = updated;
        GameData.setEnemyInfo(updated.id, updated);
        setSelectedEnemy(updated);
        setSelectedCell({x: y});
    };

    const handleFileSelect = (files: string[]) => {
        if (!selectedEnemy || files.length === 0) return;

        const updated = { ...selectedEnemy, file: [files[0], 0] as [string, number] };
        enemies[updated.id] = updated;
        GameData.setEnemyInfo(updated.id, updated);
        setSelectedEnemy(updated);
        setSelectedCell({x: 0});
        setFileSelector(prev => ({ ...prev, open: false }));
    };

    const handleSelectFile = () => {
        setFileSelector({
            open: true,
            path: path.join(root, 'assets', 'characters', 'enemies')
        });
    };

    const getEnemyImagePath = (file: string) => {
        return path.join(root, 'assets', 'characters', 'enemies', file);
    };

    const getItemName = (id: number): string => {
        const item = GameData.getItemInfo(id);
        return item ? `${id}: ${item.name}` : `${id}: 未知道具`;
    };

    const handleAttrDragEnd = (result: DropResult) => {
        if (!result.destination || !selectedEnemy) return;

        const items = [...selectedEnemy.attr];
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedEnemy = { ...selectedEnemy, attr: items };
        setSelectedEnemy(updatedEnemy);
        enemies[updatedEnemy.id] = updatedEnemy;
        GameData.setEnemyInfo(updatedEnemy.id, updatedEnemy);
    };

    const handleDropDragEnd = (result: DropResult) => {
        if (!result.destination || !selectedEnemy) return;

        const items = [...selectedEnemy.drop];
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedEnemy = { ...selectedEnemy, drop: items };
        setSelectedEnemy(updatedEnemy);
        enemies[updatedEnemy.id] = updatedEnemy;
        GameData.setEnemyInfo(updatedEnemy.id, updatedEnemy);
    };

    const handleEditAttr = (key: string, value: number) => {
        setEditingField({
            key,
            originalKey: key,
            value
        });
        setDialogOpen(true);
    };

    const handleEditDrop = (key: string, value: number) => {
        setEditingDrop({
            key,
            originalKey: key,
            value
        });
        setDropDialogOpen(true);
    };

    const handleAddAttr = () => {
        setEditingField({
            key: '',
            originalKey: '',
            value: 0
        });
        setDialogOpen(true);
    };

    const handleAddDrop = () => {
        setEditingDrop({
            key: '',
            originalKey: '',
            value: 0
        });
        setDropDialogOpen(true);
    };

    const handleSaveAttr = () => {
        if (!editingField || !selectedEnemy) return;

        if (!editingField.key.trim()) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '属性名不能为空'
            });
            return;
        }

        const updatedEnemy = { ...selectedEnemy };
        const items = updatedEnemy.attr;

        if (editingField.originalKey) {
            const index = items.findIndex(item => item.key === editingField.originalKey);
            if (index !== -1) {
                items[index] = { key: editingField.key, value: editingField.value };
            }
        } else {
            items.push({ key: editingField.key, value: editingField.value });
        }

        setSelectedEnemy(updatedEnemy);
        enemies[updatedEnemy.id] = updatedEnemy;
        GameData.setEnemyInfo(updatedEnemy.id, updatedEnemy);
        setDialogOpen(false);
    };

    const handleSaveDrop = () => {
        if (!editingDrop || !selectedEnemy) return;

        if (!editingDrop.key.trim()) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '掉落物名称不能为空'
            });
            return;
        }

        const updatedEnemy = { ...selectedEnemy };
        const items = updatedEnemy.drop;

        if (editingDrop.originalKey) {
            const index = items.findIndex(item => item.key === editingDrop.originalKey);
            if (index !== -1) {
                items[index] = { key: editingDrop.key, value: editingDrop.value };
            }
        } else {
            items.push({ key: editingDrop.key, value: editingDrop.value });
        }

        setSelectedEnemy(updatedEnemy);
        enemies[updatedEnemy.id] = updatedEnemy;
        GameData.setEnemyInfo(updatedEnemy.id, updatedEnemy);
        setDropDialogOpen(false);
    };

    const handleDeleteAttr = (key: string) => {
        if (!selectedEnemy) return;

        const updatedEnemy = { ...selectedEnemy };
        const index = updatedEnemy.attr.findIndex(item => item.key === key);
        if (index !== -1) {
            updatedEnemy.attr.splice(index, 1);
            setSelectedEnemy(updatedEnemy);
            enemies[updatedEnemy.id] = updatedEnemy;
            GameData.setEnemyInfo(updatedEnemy.id, updatedEnemy);
        }
    };

    const handleDeleteDrop = (key: string) => {
        if (!selectedEnemy) return;

        const updatedEnemy = { ...selectedEnemy };
        const index = updatedEnemy.drop.findIndex(item => item.key === key);
        if (index !== -1) {
            updatedEnemy.drop.splice(index, 1);
            setSelectedEnemy(updatedEnemy);
            enemies[updatedEnemy.id] = updatedEnemy;
            GameData.setEnemyInfo(updatedEnemy.id, updatedEnemy);
        }
    };

    const handleAddItem = () => {
        setEditingItem({
            key: 0,
            originalKey: 0,
            value: 0
        });
        setItemDialogOpen(true);
    };

    const handleEditItem = (key: number, value: number) => {
        setEditingItem({
            key,
            originalKey: key,
            value
        });
        setItemDialogOpen(true);
    };

    const handleSaveItem = () => {
        if (!editingItem || !selectedEnemy) return;

        if (editingItem.key <= 0) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '道具id不能小于等于0'
            });
            return;
        }

        const updatedEnemy = { ...selectedEnemy };
        const items = updatedEnemy.items;

        if (editingItem.originalKey) {
            const index = items.findIndex(item => item.id === editingItem.originalKey);
            if (index !== -1) {
                items[index] = { id: editingItem.key, number: editingItem.value };
            }
        } else {
            items.push({ id: editingItem.key, number: editingItem.value });
        }

        setSelectedEnemy(updatedEnemy);
        enemies[updatedEnemy.id] = updatedEnemy;
        GameData.setEnemyInfo(updatedEnemy.id, updatedEnemy);
        setItemDialogOpen(false);
    };

    const handleDeleteItem = (key: number) => {
        if (!selectedEnemy) return;

        const updatedEnemy = { ...selectedEnemy };
        const index = updatedEnemy.items.findIndex(item => item.id === key);
        if (index !== -1) {
            updatedEnemy.items.splice(index, 1);
            setSelectedEnemy(updatedEnemy);
            enemies[updatedEnemy.id] = updatedEnemy;
            GameData.setEnemyInfo(updatedEnemy.id, updatedEnemy);
        }
    };

    const handleItemDragEnd = (result: DropResult) => {
        if (!result.destination || !selectedEnemy) return;

        const items = [...selectedEnemy.items];
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedEnemy = { ...selectedEnemy, items };
        setSelectedEnemy(updatedEnemy);
        enemies[updatedEnemy.id] = updatedEnemy;
        GameData.setEnemyInfo(updatedEnemy.id, updatedEnemy);
    };

    return (
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper sx={{ width: '15vh', p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <h3>敌人列表</h3>
                    <IconButton
                        onClick={handleAddEnemy}
                        color="primary"
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
                <List>
                    {enemies.map((enemy) => (
                        <ListItemButton
                            key={enemy.id}
                            selected={selectedEnemy?.id === enemy.id}
                            onClick={() => setSelectedEnemy(enemy)}
                            onContextMenu={(e) => handleContextMenu(e, 'enemy', enemy.id)}
                        >
                            <ListItemText primary={`${enemy.id}: ${enemy.name}`} />
                        </ListItemButton>
                    ))}
                </List>
            </Paper>

            {selectedEnemy && (
                <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Grid2 container spacing={2}>
                            <Grid2 size={{xs:12}}>
                                <TextField
                                    label="名称"
                                    value={selectedEnemy.name}
                                    onChange={(e) => {
                                        const updated = { ...selectedEnemy, name: e.target.value };
                                        enemies[updated.id] = updated;
                                        GameData.setEnemyInfo(updated.id, updated);
                                        setSelectedEnemy(updated);
                                    }}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={{xs:12}}>
                                <TextField
                                    label="描述"
                                    value={selectedEnemy.description}
                                    onChange={(e) => {
                                        const updated = { ...selectedEnemy, description: e.target.value };
                                        enemies[updated.id] = updated;
                                        GameData.setEnemyInfo(updated.id, updated);
                                        setSelectedEnemy(updated);
                                    }}
                                    multiline
                                    rows={3}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={{xs:12}}>
                                <Paper sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <h3>能力值</h3>
                                        <IconButton
                                            onClick={handleAddAttr}
                                            color="primary"
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    </Box>
                                    <DragDropContext onDragEnd={handleAttrDragEnd}>
                                        <Droppable droppableId="attr">
                                            {(provided: DroppableProvided) => (
                                                <List {...provided.droppableProps} ref={provided.innerRef}>
                                                    {selectedEnemy.attr.map((item, index) => (
                                                        <Draggable key={item.key} draggableId={item.key} index={index}>
                                                            {(provided: DraggableProvided) => (
                                                                <ListItemButton
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                onClick={() => handleEditAttr(item.key, item.value)}
                                                                onContextMenu={(e) => handleContextMenu(e, 'attr', item.key)}
                                                                sx={{ display: 'flex', justifyContent: 'space-between' }}
                                                            >
                                                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                                    <Box {...provided.dragHandleProps} sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                                                        <DragIndicatorIcon />
                                                                    </Box>
                                                                    <ListItemText primary={`${item.key}: ${item.value}`} />
                                                                </Box>
                                                            </ListItemButton>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </List>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </Paper>
                            </Grid2>
                            <Grid2 size={{xs:12}}>
                                <Paper sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <h3>掉落物</h3>
                                        <IconButton
                                            onClick={handleAddDrop}
                                            color="primary"
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    </Box>
                                    <DragDropContext onDragEnd={handleDropDragEnd}>
                                        <Droppable droppableId="drop">
                                            {(provided: DroppableProvided) => (
                                                <List {...provided.droppableProps} ref={provided.innerRef}>
                                                    {selectedEnemy.drop.map((item, index) => (
                                                        <Draggable key={item.key} draggableId={item.key} index={index}>
                                                            {(provided: DraggableProvided) => (
                                                                <ListItemButton
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                onClick={() => handleEditDrop(item.key, item.value)}
                                                                onContextMenu={(e) => handleContextMenu(e, 'drop', item.key)}
                                                                sx={{ display: 'flex', justifyContent: 'space-between' }}
                                                            >
                                                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                                    <Box {...provided.dragHandleProps} sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                                                        <DragIndicatorIcon />
                                                                    </Box>
                                                                    <ListItemText primary={`${item.key}: ${item.value}`} />
                                                                </Box>
                                                            </ListItemButton>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </List>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </Paper>
                            </Grid2>
                            <Grid2 size={{xs:12}}>
                                <Paper sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <h3>掉落道具</h3>
                                        <IconButton
                                            onClick={handleAddItem}
                                            color="primary"
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    </Box>
                                    <DragDropContext onDragEnd={handleItemDragEnd}>
                                        <Droppable droppableId="items">
                                            {(provided: DroppableProvided) => (
                                                <List {...provided.droppableProps} ref={provided.innerRef}>
                                                    {selectedEnemy.items.map((item, index) => (
                                                        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                                            {(provided: DraggableProvided) => (
                                                                <ListItemButton
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                onClick={() => handleEditItem(item.id, item.number)}
                                                                onContextMenu={(e) => handleContextMenu(e, 'item', item.id)}
                                                                sx={{ display: 'flex', justifyContent: 'space-between' }}
                                                            >
                                                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                                    <Box {...provided.dragHandleProps} sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                                                        <DragIndicatorIcon />
                                                                    </Box>
                                                                    <ListItemText primary={`${getItemName(item.id)} x${item.number}`} />
                                                                </Box>
                                                            </ListItemButton>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </List>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </Paper>
                            </Grid2>
                        </Grid2>
                    </Box>
                    <Box sx={{ width: '300px' }}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <h3>敌人行走图</h3>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                        {selectedEnemy.file[0] ? (
                                            <>
                                                <img
                                                    src={`file://${getEnemyImagePath(selectedEnemy.file[0])}`}
                                                    alt={selectedEnemy.file[0]}
                                                    style={{
                                                        imageRendering: 'pixelated',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={handleImageClick}
                                                    onLoad={(e) => setImageWidth(e.currentTarget.width)}
                                                />
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: selectedEnemy.file[1] * 32,
                                                        left: 0,
                                                        width: `${imageWidth}px`,
                                                        height: '32px',
                                                        border: '2px solid black',
                                                        boxSizing: 'border-box',
                                                        pointerEvents: 'none'
                                                    }}
                                                />
                                            </>
                                        ) : (
                                            <Box
                                                sx={{
                                                    width: '128px',
                                                    height: '128px',
                                                    backgroundColor: '#ccc'
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Button
                                        variant="contained"
                                        onClick={handleSelectFile}
                                    >
                                        ...
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            )}

            <SingleInput
                label="新建敌人"
                inputType="敌人名称"
                dialogOpen={newEnemyDialog}
                handleOnClose={() => setNewEnemyDialog(false)}
                content={newEnemyName}
                handleOnChange={(e) => setNewEnemyName(e.target.value)}
                handleSave={handleCreateEnemy}
            />

            <DoubleInput
                mapName="编辑能力值"
                mapKeyName="能力名称"
                mapValueName="能力值"
                dialogOpen={dialogOpen}
                handleOnClose={() => setDialogOpen(false)}
                editingField={editingField ? { type: 'attr', ...editingField } : null}
                handleKeyOnChange={(e) => setEditingField(prev => prev ? { ...prev, key: e.target.value } : null)}
                handleValueOnChange={(e) => setEditingField(prev => prev ? { ...prev, value: Number(e.target.value) } : null)}
                handleSave={handleSaveAttr}
            />

            <DoubleInput
                mapName="编辑掉落物"
                mapKeyName="掉落物名称"
                mapValueName="数量"
                dialogOpen={dropDialogOpen}
                handleOnClose={() => setDropDialogOpen(false)}
                editingField={editingDrop ? { type: 'attr', ...editingDrop } : null}
                handleKeyOnChange={(e) => setEditingDrop(prev => prev ? { ...prev, key: e.target.value } : null)}
                handleValueOnChange={(e) => setEditingDrop(prev => prev ? { ...prev, value: Number(e.target.value) } : null)}
                handleSave={handleSaveDrop}
            />

            <DoubleInput
                mapName="编辑掉落道具"
                mapKeyName="道具ID"
                mapValueName="数量"
                dialogOpen={itemDialogOpen}
                handleOnClose={() => setItemDialogOpen(false)}
                editingField={editingItem ? { type: 'items', key: editingItem.key.toString(), originalKey: editingItem.originalKey.toString(), value: editingItem.value } : null}
                handleKeyOnChange={(e) => {
                    const value = parseInt(e.target.value);
                    setEditingItem(prev => prev ? { ...prev, key: isNaN(value) ? 0 : value } : null);
                }}
                handleValueOnChange={(e) => setEditingItem(prev => prev ? { ...prev, value: Number(e.target.value) } : null)}
                handleSave={handleSaveItem}
            />

            <FileSelector
                open={fileSelector.open}
                path={fileSelector.path}
                onClose={() => setFileSelector(prev => ({ ...prev, open: false }))}
                onSelect={handleFileSelect}
                multiple={false}
            />

            <Hint
                snackbar={snackbar}
                handleOnClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            />

            <Menu
                open={contextMenu !== null}
                onClose={handleContextMenuClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem onClick={handleDeleteFromMenu}>删除</MenuItem>
            </Menu>
        </Box>
    );
}

export default EnemyEditor;