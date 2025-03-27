import { useState } from 'react';
import { Box, List, ListItemButton, ListItemText, Paper, TextField, Button, Grid2 } from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import GameData, { Actor } from './GameData';
import Hint from './utils/uHint';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileSelector from './utils/FileSelector';
import DoubleInput from 'utils/DoubleInput';
import SingleInput from 'utils/SingleInput';
import ComboBox from 'utils/ComboBox';
const path = window.require('path');

interface ActorEditorProps {
    actors: Actor[];
    root: string;
}

function ActorEditor({ actors, root }: ActorEditorProps) {
    const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
    const [editingField, setEditingField] = useState<{
        type: 'attr' | 'wealth' | 'items',
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
    const [newActorDialog, setNewActorDialog] = useState(false);
    const [newActorName, setNewActorName] = useState('');
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [mapName, setMapName] = useState('');
    const [mapKeyName, setMapKeyName] = useState('');
    const [mapValueName, setMapValueName] = useState('');
    const [equipSlotDialog, setEquipSlotDialog] = useState(false);
    const [newEquipSlot, setNewEquipSlot] = useState('');
    const [editingEquipSlotIndex, setEditingEquipSlotIndex] = useState<number | null>(null);

    const handleAddActor = () => {
        setNewActorName('');
        setNewActorDialog(true);
    };

    const handleCreateActor = () => {
        if (!newActorName.trim()) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '角色名称不能为空'
            });
            return;
        }

        const newId = actors.length;
        const newActor: Actor = {
            id: newId,
            name: newActorName,
            file: '',
            attr: [
                { key: 'level', value: 1 },
                { key: 'hp', value: 1000 },
                { key: 'atk', value: 10 },
                { key: 'def', value: 10 }
            ],
            wealth: [
                { key: 'exp', value: 0 },
                { key: 'gold', value: 0 }
            ],
            items: [],
            equip_slot: [],
            equip: [],
            animation_id: 0
        };

        actors.push(newActor);
        setNewActorDialog(false);
        setSelectedActor(newActor);
    };

    const handleDeleteActor = (actor: Actor, event: React.MouseEvent) => {
        event.stopPropagation();
        if (actors.length === 2) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '至少保留一个角色'
            });
            return;
        }

        const actor_index = actors.findIndex(a => a && a.id === actor.id);
        if (actor_index !== -1) {
            actors.splice(actor_index, 1);
            for (let i = actor_index; i < actors.length; i++) {
                actors[i].id = i;
            }
            if (selectedActor?.id === actor.id) {
                setSelectedActor(actors[0] || null);
            }
            setUpdateTrigger(prev => prev + 1);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedActor) return;

        const updated = { ...selectedActor, name: e.target.value };

        actors[updated.id] = updated;

        setSelectedActor(updated);
    };

    const handleDragEnd = (result: DropResult, type: 'attr' | 'wealth' | 'items') => {
        if (!result.destination || !selectedActor) return;

        const items = [...selectedActor[type]];
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedActor = { ...selectedActor, [type]: items };
        setSelectedActor(updatedActor);
        actors[updatedActor.id] = updatedActor;
    };

    const handleEditField = (type: 'attr' | 'wealth' | 'items', key: string, value: number) => {
        setEditingField({
            type,
            key,
            originalKey: key,  // 保存原始key
            value
        });
        setDialogOpen(true);
        if (type === 'attr') {
            setMapName("编辑属性");
            setMapKeyName("属性名");
            setMapValueName("属性值");
        }
        else if (type === 'wealth') {
            setMapName("编辑财富");
            setMapKeyName("财富名");
            setMapValueName("财富值");
        }
        else if (type === 'items') {
            setMapName("编辑物品");
            setMapKeyName("物品ID");
            setMapValueName("初始携带数量");
        }
    };

    const handleDelete = (type: 'attr' | 'wealth' | 'items', key: string) => {
        if (!selectedActor) return;

        const updatedActor = { ...selectedActor };
        const items = updatedActor[type] as { key: string, value: number }[];
        const index = items.findIndex(item => item.key === key);
        if (index !== -1) {
            items.splice(index, 1);
            setSelectedActor(updatedActor);
            actors[updatedActor.id] = updatedActor;
        }
    };

    const handleAdd = (type: 'attr' | 'wealth' | 'items') => {
        setEditingField({
            type,
            key: '',
            originalKey: '',
            value: 0
        });
        setDialogOpen(true);
        if (type === 'attr') {
            setMapName("编辑属性");
        }
        else if (type === 'wealth') {
            setMapName("编辑财富");
        }
        else if (type === 'items') {
            setMapName("编辑物品");
        }
    };

    const handleSave = () => {
        if (!editingField || !selectedActor) return;

        if (!editingField.key.trim()) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '此处不能为空'
            });
            return;
        }

        if (isNaN(editingField.value)) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '值必须是数字'
            });
            return;
        }

        const updatedActor = { ...selectedActor };
        const items = updatedActor[editingField.type] as { key: string, value: number }[];

        if (editingField.originalKey) {
            // 编辑现有项
            const index = items.findIndex(item => item.key === editingField.originalKey);
            if (index !== -1) {
                items[index] = { key: editingField.key, value: editingField.value };
            }
        } else {
            // 添加新项
            items.push({ key: editingField.key, value: editingField.value });
        }

        setSelectedActor(updatedActor);
        actors[updatedActor.id] = updatedActor;
        setDialogOpen(false);
    };

    const renderMapEditor = (title: string, items: { key: string, value: number }[], type: 'attr' | 'wealth' | 'items') => (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <h3 style={{ margin: 0 }}>{title}</h3>
                <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAdd(type)}
                    variant="contained"
                    size="small"
                >
                    添加
                </Button>
            </Box>
            <DragDropContext
                onDragEnd={(result) => handleDragEnd(result, type)}
                onDragStart={() => {}}
                onDragUpdate={() => {}}
            >
                <Droppable droppableId={type} type={type}>
                    {(provided: DroppableProvided) => (
                        <List {...provided.droppableProps} ref={provided.innerRef}>
                            {items.map((item, index) => (
                                <Draggable key={item.key} draggableId={`${type}-${item.key}`} index={index}>
                                    {(provided: DraggableProvided) => (
                                        <ListItemButton
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            onClick={() => handleEditField(type, item.key, item.value)}
                                            sx={{ display: 'flex', justifyContent: 'space-between' }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                <Box {...provided.dragHandleProps} sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                                    <DragIndicatorIcon />
                                                </Box>
                                                <ListItemText
                                                    primary={
                                                        type === 'items'
                                                            ? `${item.key}: ${GameData.getItemInfo(Number(item.key))?.name || '未知物品'} x ${item.value}`
                                                            : `${item.key}: ${item.value}`
                                                    }
                                                />
                                            </Box>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(type, item.key);
                                                }}
                                            >
                                                <DeleteIcon />
                                            </Button>
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
    );

    const getCharacterImagePath = (file: string) => {
        return path.join(root, 'assets', 'characters', 'actors', file);
    };

    const [fileSelector, setFileSelector] = useState({
        open: false,
        path: ''
    });

    const handleImageClick = () => {
        setFileSelector({
            open: true,
            path: path.join(root, 'assets', 'characters', 'actors')
        });
    };

    const handleFileSelect = (files: string[]) => {
        if (!selectedActor || files.length === 0) return;

        const updated = { ...selectedActor, file: files[0] };

        actors[updated.id] = updated;

        setSelectedActor(updated);
    };

    const handleEquipSlotDragEnd = (result: DropResult) => {
        if (!result.destination || !selectedActor) return;

        const items = [...selectedActor.equip_slot];
        const equips = [...selectedActor.equip];

        const [reorderedSlot] = items.splice(result.source.index, 1);
        const [reorderedEquip] = equips.splice(result.source.index, 1);

        items.splice(result.destination.index, 0, reorderedSlot);
        equips.splice(result.destination.index, 0, reorderedEquip);

        const updatedActor = { ...selectedActor, equip_slot: items, equip: equips };
        setSelectedActor(updatedActor);
        actors[updatedActor.id] = updatedActor;
    };

    const handleAddEquipSlot = () => {
        setNewEquipSlot('');
        setEditingEquipSlotIndex(null);
        setEquipSlotDialog(true);
    };

    const handleEditEquipSlot = (slot: string, index: number) => {
        setNewEquipSlot(slot);
        setEditingEquipSlotIndex(index);
        setEquipSlotDialog(true);
    };

    const handleSaveEquipSlot = () => {
        if (!selectedActor || !newEquipSlot.trim()) return;

        const updatedActor = { ...selectedActor };

        if (editingEquipSlotIndex !== null) {
            updatedActor.equip_slot[editingEquipSlotIndex] = newEquipSlot;
            updatedActor.equip[editingEquipSlotIndex] = 0;
        } else {
            updatedActor.equip_slot.push(newEquipSlot);
            updatedActor.equip.push(0);
        }

        setSelectedActor(updatedActor);
        actors[updatedActor.id] = updatedActor;
        setEquipSlotDialog(false);
    };

    const handleDeleteEquipSlot = (index: number) => {
        if (!selectedActor) return;

        const updatedActor = { ...selectedActor };
        updatedActor.equip_slot.splice(index, 1);
        updatedActor.equip.splice(index, 1);

        setSelectedActor(updatedActor);
        actors[updatedActor.id] = updatedActor;
    };

    const handleEquipChange = (index: number, value: number) => {
        if (!selectedActor) return;

        const updatedActor = { ...selectedActor };
        updatedActor.equip[index] = value;

        setSelectedActor(updatedActor);
        actors[updatedActor.id] = updatedActor;
    };

    const renderEquipSlots = () => (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <h3 style={{ margin: 0 }}>装备槽</h3>
                <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddEquipSlot}
                    variant="contained"
                    size="small"
                >
                    添加
                </Button>
            </Box>
            <DragDropContext onDragEnd={handleEquipSlotDragEnd}>
                <Droppable droppableId="equip-slots">
                    {(provided) => (
                        <List {...provided.droppableProps} ref={provided.innerRef}>
                            {selectedActor?.equip_slot.map((slot, index) => (
                                <Draggable key={`${slot}-${index}`} draggableId={`${slot}-${index}`} index={index}>
                                    {(provided) => (
                                        <ListItemButton
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            onClick={() => handleEditEquipSlot(slot, index)}
                                            sx={{ display: 'flex', justifyContent: 'space-between' }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                <Box {...provided.dragHandleProps} sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                                    <DragIndicatorIcon />
                                                </Box>
                                                <ListItemText primary={slot} />
                                            </Box>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteEquipSlot(index);
                                                }}
                                            >
                                                <DeleteIcon />
                                            </Button>
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
    );

    const renderInitialEquips = () => {
        const allEquips = GameData.getAllEquipInfo();

        return (
            <Paper sx={{ p: 2, mb: 2 }}>
                <h3>初始装备</h3>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedActor?.equip_slot.map((slot, index) => {
                        const filteredOptions = allEquips
                            .filter(equip => equip && equip.type === slot)
                            .map(equip => ({
                                value: equip.id,
                                label: `${equip.id}: ${equip.name}`
                            }));

                        return (
                            <ComboBox
                                key={`${slot}-${index}`}
                                label={slot}
                                value={selectedActor.equip[index]}
                                options={filteredOptions}
                                onChange={(value) => handleEquipChange(index, value)}
                            />
                        );
                    })}
                </Box>
            </Paper>
        );
    };

    return (
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper sx={{ width: '200px', p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <h3 style={{ margin: 0 }}>角色列表</h3>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddActor}
                        variant="contained"
                        size="small"
                    >
                        添加
                    </Button>
                </Box>
                <List>
                    {actors.map((actor) => (
                        <ListItemButton
                            key={actor.id}
                            selected={selectedActor?.id === actor.id}
                            onClick={() => setSelectedActor(actor)}
                        >
                            <ListItemText primary={`${actor.id}: ${actor.name}`} />
                            <Button
                                size="small"
                                color="error"
                                onClick={(e) => handleDeleteActor(actor, e)}
                            >
                                <DeleteIcon />
                            </Button>
                        </ListItemButton>
                    ))}
                </List>
            </Paper>

            {selectedActor && (
                <Box sx={{ flex: 1 }}>
                    <Grid2 container spacing={2}>
                        <Grid2 size={{xs: 12}}>
                            <TextField
                                label="名称"
                                value={selectedActor.name}
                                onChange={handleNameChange}
                                fullWidth
                            />
                        </Grid2>
                        <Grid2 size={{xs: 12}}>
                            <Paper
                                sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                                onClick={handleImageClick}
                            >
                                {selectedActor.file ? (
                                    <img
                                        src={`file://${getCharacterImagePath(selectedActor.file)}`}
                                        alt={selectedActor.file}
                                        style={{
                                            imageRendering: 'pixelated'
                                        }}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            width: '128px',
                                            height: '128px',
                                            backgroundColor: '#ccc'
                                        }}
                                    />
                                )}
                            </Paper>
                        </Grid2>
                    </Grid2>
                    {renderMapEditor('属性', selectedActor.attr, 'attr')}
                    {renderMapEditor('财富', selectedActor.wealth, 'wealth')}
                    {renderMapEditor('物品', selectedActor.items, 'items')}
                    {renderEquipSlots()}
                    {renderInitialEquips()}
                </Box>
            )}

            <DoubleInput
                mapName={mapName}
                mapKeyName={mapKeyName}
                mapValueName={mapValueName}
                dialogOpen={dialogOpen}
                handleOnClose={() => setDialogOpen(false)}
                editingField={editingField}
                handleKeyOnChange={(e) => setEditingField(prev => prev ? { ...prev, key: e.target.value } : null)}
                handleValueOnChange={(e) => setEditingField(prev => prev ? { ...prev, value: Number(e.target.value) } : null)}
                handleSave={handleSave}
            />

            <Hint
                snackbar={snackbar}
                handleOnClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            />
            <FileSelector
                open={fileSelector.open}
                onClose={() => setFileSelector(prev => ({ ...prev, open: false }))}
                path={fileSelector.path}
                onSelect={handleFileSelect}
                multiple={false}
            />
            <SingleInput
                label="新建角色"
                inputType="角色名称"
                dialogOpen={newActorDialog}
                handleOnClose={() => setNewActorDialog(false)}
                content={newActorName}
                handleOnChange={(e) => setNewActorName(e.target.value)}
                handleSave={handleCreateActor}
            />
            <SingleInput
                label="新建装备槽"
                inputType="装备类型"
                dialogOpen={equipSlotDialog}
                handleOnClose={() => setEquipSlotDialog(false)}
                content={newEquipSlot}
                handleOnChange={(e) => setNewEquipSlot(e.target.value)}
                handleSave={handleSaveEquipSlot}
            />
        </Box>
    );
}

export default ActorEditor;