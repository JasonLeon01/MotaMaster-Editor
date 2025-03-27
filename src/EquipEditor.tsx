import { useState } from 'react';
import { Box, List, ListItemButton, ListItemText, Paper, TextField, Button, Grid2, IconButton } from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import GameData, { Equip } from './GameData';
import Hint from './utils/uHint';
import FileSelector from './utils/FileSelector';
import DoubleInput from 'utils/DoubleInput';
import SingleInput from 'utils/SingleInput';
const path = window.require('path');

interface EquipEditorProps {
    equips: Equip[];
    root: string;
}

function EquipEditor({ equips, root }: EquipEditorProps) {
    const [selectedEquip, setSelectedEquip] = useState<Equip | null>(null);
    const [newEquipDialog, setNewEquipDialog] = useState(false);
    const [newEquipName, setNewEquipName] = useState('');
    const [editingField, setEditingField] = useState<{
        key: string,
        originalKey: string,
        value: number
    } | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        severity: 'success' | 'info' | 'warning' | 'error';
        message: string;
    }>({ open: false, severity: 'warning', message: '' });
    const [fileSelector, setFileSelector] = useState({
        open: false,
        path: ''
    });
    const [selectedCell, setSelectedCell] = useState<{x: number, y: number}>({x: 0, y: 0});
    const [updateTrigger, setUpdateTrigger] = useState(0);

    const handleAddEquip = () => {
        setNewEquipName('');
        setNewEquipDialog(true);
    };

    const handleCreateEquip = () => {
        if (!newEquipName.trim()) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '装备名称不能为空'
            });
            return;
        }

        const newId = equips.length;
        const newEquip: Equip = {
            id: newId,
            name: newEquipName,
            file: ['', 0, 0],
            description: '',
            attr_plus: [],
            price: 0,
            type: '',
            animation_id: 1
        };

        equips.push(newEquip);
        GameData.setEquipInfo(newId, newEquip);
        setNewEquipDialog(false);
        setSelectedEquip(newEquip);
    };

    const handleDeleteEquip = (equip: Equip, event: React.MouseEvent) => {
        event.stopPropagation();
        if (equips.length === 2) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '至少需要保留一个装备'
            });
            return;
        }

        const equip_index = equips.findIndex(i => i && i.id === equip.id);
        if (equip_index !== -1) {
            equips.splice(equip_index, 1);
            for (let i = equip_index; i < equips.length; i++) {
                equips[i].id = i;
                GameData.setEquipInfo(i, equips[i]);
            }
            if (selectedEquip?.id === equip.id) {
                setSelectedEquip(equips[0] || null);
            }
            setUpdateTrigger(prev => prev + 1);
        }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 32);
        const y = Math.floor((e.clientY - rect.top) / 32);
        handleCellSelect(y, x);
    };

    const handleCellSelect = (x: number, y: number) => {
        if (!selectedEquip) return;

        const updated = {
            ...selectedEquip,
            file: [selectedEquip.file[0], x, y] as [string, number, number]
        };
        equips[updated.id] = updated;
        GameData.setEquipInfo(updated.id, updated);
        setSelectedEquip(updated);
        setSelectedCell({x, y});
    };

    const handleFileSelect = (files: string[]) => {
        if (!selectedEquip || files.length === 0) return;

        const updated = { ...selectedEquip, file: [files[0], 0, 0] as [string, number, number] };
        equips[updated.id] = updated;
        GameData.setEquipInfo(updated.id, updated);
        setSelectedEquip(updated);
        setSelectedCell({x: 0, y: 0});
        setFileSelector(prev => ({ ...prev, open: false }));
    };

    const handleSelectFile = () => {
        setFileSelector({
            open: true,
            path: path.join(root, 'assets', 'characters', 'equips')
        });
    };

    const getEquipImagePath = (file: string) => {
        return path.join(root, 'assets', 'characters', 'equips', file);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination || !selectedEquip) return;

        const items = [...selectedEquip.attr_plus];
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedEquip = { ...selectedEquip, attr_plus: items };
        setSelectedEquip(updatedEquip);
        equips[updatedEquip.id] = updatedEquip;
        GameData.setEquipInfo(updatedEquip.id, updatedEquip);
    };

    const handleEditField = (key: string, value: number) => {
        setEditingField({
            key,
            originalKey: key,
            value
        });
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingField({
            key: '',
            originalKey: '',
            value: 0
        });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!editingField || !selectedEquip) return;

        if (!editingField.key.trim()) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '属性名不能为空'
            });
            return;
        }

        const updatedEquip = { ...selectedEquip };
        const items = updatedEquip.attr_plus;

        if (editingField.originalKey) {
            const index = items.findIndex(item => item.key === editingField.originalKey);
            if (index !== -1) {
                items[index] = { key: editingField.key, value: editingField.value };
            }
        } else {
            items.push({ key: editingField.key, value: editingField.value });
        }

        setSelectedEquip(updatedEquip);
        equips[updatedEquip.id] = updatedEquip;
        GameData.setEquipInfo(updatedEquip.id, updatedEquip);
        setDialogOpen(false);
    };

    const handleDelete = (key: string) => {
        if (!selectedEquip) return;

        const updatedEquip = { ...selectedEquip };
        const index = updatedEquip.attr_plus.findIndex(item => item.key === key);
        if (index !== -1) {
            updatedEquip.attr_plus.splice(index, 1);
            setSelectedEquip(updatedEquip);
            equips[updatedEquip.id] = updatedEquip;
            GameData.setEquipInfo(updatedEquip.id, updatedEquip);
        }
    };

    const renderImageSelector = () => {
        if (!selectedEquip) return null;

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    {selectedEquip.file[0] ? (
                        <>
                            <img
                                src={`file://${getEquipImagePath(selectedEquip.file[0])}`}
                                alt={selectedEquip.file[0]}
                                style={{
                                    imageRendering: 'pixelated',
                                    cursor: 'pointer'
                                }}
                                onClick={handleImageClick}
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
                    <Box
                        sx={{
                            position: 'absolute',
                            top: selectedEquip.file[1] * 32,
                            left: selectedEquip.file[2] * 32,
                            width: '32px',
                            height: '32px',
                            border: '2px solid black',
                            boxSizing: 'border-box',
                            pointerEvents: 'none'
                        }}
                    />
                </Box>
                <Button
                    variant="contained"
                    onClick={handleSelectFile}
                >
                    ...
                </Button>
            </Box>
        );
    };

    return (
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper sx={{ width: '200px', p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <h3 style={{ margin: 0 }}>装备列表</h3>
                    <IconButton
                        onClick={handleAddEquip}
                        color="primary"
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
                <List>
                    {equips.map((equip) => (
                        <ListItemButton
                            key={equip.id}
                            selected={selectedEquip?.id === equip.id}
                            onClick={() => setSelectedEquip(equip)}
                        >
                            <ListItemText primary={`${equip.id}: ${equip.name}`} />
                            <IconButton
                                size="small"
                                onClick={(e) => handleDeleteEquip(equip, e)}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </ListItemButton>
                    ))}
                </List>
            </Paper>

            {selectedEquip && (
                <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Grid2 container spacing={2}>
                            <Grid2 size={{xs:12}}>
                                <TextField
                                    label="名称"
                                    value={selectedEquip.name}
                                    onChange={(e) => {
                                        const updated = { ...selectedEquip, name: e.target.value };
                                        equips[updated.id] = updated;
                                        GameData.setEquipInfo(updated.id, updated);
                                        setSelectedEquip(updated);
                                    }}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={{xs:12}}>
                                <TextField
                                    label="描述"
                                    value={selectedEquip.description}
                                    onChange={(e) => {
                                        const updated = { ...selectedEquip, description: e.target.value };
                                        equips[updated.id] = updated;
                                        GameData.setEquipInfo(updated.id, updated);
                                        setSelectedEquip(updated);
                                    }}
                                    multiline
                                    rows={3}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={{xs:12}}>
                                <TextField
                                    label="价格"
                                    type="number"
                                    value={selectedEquip.price}
                                    onChange={(e) => {
                                        const updated = { ...selectedEquip, price: Number(e.target.value) };
                                        equips[updated.id] = updated;
                                        GameData.setEquipInfo(updated.id, updated);
                                        setSelectedEquip(updated);
                                    }}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={{xs:12}}>
                                <TextField
                                    label="装备类型"
                                    value={selectedEquip.type}
                                    onChange={(e) => {
                                        const updated = { ...selectedEquip, type: e.target.value };
                                        equips[updated.id] = updated;
                                        GameData.setEquipInfo(updated.id, updated);
                                        setSelectedEquip(updated);
                                    }}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={{xs:12}}>
                                <TextField
                                    label="动画ID"
                                    type="number"
                                    value={selectedEquip.animation_id}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        if (value > 0) {
                                            const updated = { ...selectedEquip, animation_id: value };
                                            equips[updated.id] = updated;
                                            GameData.setEquipInfo(updated.id, updated);
                                            setSelectedEquip(updated);
                                        }
                                    }}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={{xs:12}}>
                                <Paper sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <h3 style={{ margin: 0 }}>属性加成</h3>
                                        <IconButton
                                            onClick={handleAdd}
                                            color="primary"
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    </Box>
                                    <DragDropContext onDragEnd={handleDragEnd}>
                                        <Droppable droppableId="attr_plus">
                                            {(provided: DroppableProvided) => (
                                                <List {...provided.droppableProps} ref={provided.innerRef}>
                                                    {selectedEquip.attr_plus.map((item, index) => (
                                                        <Draggable key={item.key} draggableId={item.key} index={index}>
                                                            {(provided: DraggableProvided) => (
                                                                <ListItemButton
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    onClick={() => handleEditField(item.key, item.value)}
                                                                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                                        <Box {...provided.dragHandleProps} sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                                                            <DragIndicatorIcon />
                                                                        </Box>
                                                                        <ListItemText primary={`${item.key}: ${item.value}`} />
                                                                    </Box>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDelete(item.key);
                                                                        }}
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
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
                                <h3 style={{ margin: 0 }}>装备图片</h3>
                                {renderImageSelector()}
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            )}

            <SingleInput
                label="新建装备"
                inputType="装备名称"
                dialogOpen={newEquipDialog}
                handleOnClose={() => setNewEquipDialog(false)}
                content={newEquipName}
                handleOnChange={(e) => setNewEquipName(e.target.value)}
                handleSave={handleCreateEquip}
            />

            <DoubleInput
                mapName="编辑属性"
                mapKeyName="属性名"
                mapValueName="属性值"
                dialogOpen={dialogOpen}
                handleOnClose={() => setDialogOpen(false)}
                editingField={editingField ? { type: 'attr', ...editingField } : null}
                handleKeyOnChange={(e) => setEditingField(prev => prev ? { ...prev, key: e.target.value } : null)}
                handleValueOnChange={(e) => setEditingField(prev => prev ? { ...prev, value: Number(e.target.value) } : null)}
                handleSave={handleSave}
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
        </Box>
    );
}

export default EquipEditor;