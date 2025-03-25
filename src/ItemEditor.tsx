import { useState } from 'react';
import { Box, List, ListItemButton, ListItemText, Paper, TextField, Button, Grid2, Checkbox, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import GameData, { Item } from './GameData';
import Hint from './utils/uHint';
import FileSelector from './utils/FileSelector';
import SingleInput from 'utils/SingleInput';
const path = window.require('path');

interface ItemEditorProps {
    items: Item[];
    root: string;
}

function ItemEditor({ items, root }: ItemEditorProps) {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [newItemDialog, setNewItemDialog] = useState(false);
    const [newItemName, setNewItemName] = useState('');
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

    const handleAddItem = () => {
        setNewItemName('');
        setNewItemDialog(true);
    };

    const handleCreateItem = () => {
        if (!newItemName.trim()) {
            setSnackbar({
                open: true,
                severity: 'warning',
                message: '物品名称不能为空'
            });
            return;
        }

        const newId = items.length;
        const newItem: Item = {
            id: newId,
            name: newItemName,
            file: ['items.png', 0, 0],
            description: '',
            price: 0,
            cost: true,
            event: null
        };

        items.push(newItem);
        GameData.setItemInfo(newId, newItem);
        setNewItemDialog(false);
        setSelectedItem(newItem);
    };

    const handleDeleteItem = (item: Item, event: React.MouseEvent) => {
        event.stopPropagation();
        const item_index = items.findIndex(i => i.id === item.id);
        if (item_index !== -1) {
            items.splice(item_index, 1);
            for (let i = item_index; i < items.length; i++) {
                items[i].id = i;
                GameData.setItemInfo(i, items[i]);
            }
            if (selectedItem?.id === item.id) {
                setSelectedItem(items[0] || null);
            }
        }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 32);
        const y = Math.floor((e.clientY - rect.top) / 32);
        handleCellSelect(y, x);
    };

    const handleCellSelect = (x: number, y: number) => {
        if (!selectedItem) {
            return;
        }
        const updated = {
            ...selectedItem,
            file: [selectedItem.file[0], x, y] as [string, number, number]
        };
        items[updated.id] = updated;
        GameData.setItemInfo(updated.id, updated);
        setSelectedItem(updated);
        setSelectedCell({x, y});
    };

    const handleFileSelect = (files: string[]) => {
        if (!selectedItem || files.length === 0) {
            return;
        }
        const updated = { ...selectedItem, file: [files[0], 0, 0] as [string, number, number] };
        items[updated.id] = updated;
        GameData.setItemInfo(updated.id, updated);
        setSelectedItem(updated);
        setSelectedCell({x: 0, y: 0});
        setFileSelector(prev => ({ ...prev, open: false }));
    };

    const handleSelectFile = () => {
        setFileSelector({
            open: true,
            path: path.join(root, 'assets', 'characters', 'items')
        });
    };

    const getItemImagePath = (file: string) => {
        return path.join(root, 'assets', 'characters', 'items', file);
    };

    const renderImageSelector = () => {
        if (!selectedItem) {
            return null;
        }
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <img
                        src={`file://${getItemImagePath(selectedItem.file[0])}`}
                        alt={selectedItem.file[0]}
                        style={{
                            imageRendering: 'pixelated',
                            cursor: 'pointer'
                        }}
                        onClick={handleImageClick}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            top: selectedItem.file[1] * 32,
                            left: selectedItem.file[2] * 32,
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
                    <h3 style={{ margin: 0 }}>物品列表</h3>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddItem}
                        variant="contained"
                        size="small"
                    >
                        添加
                    </Button>
                </Box>
                <List>
                    {items.map((item) => (
                        <ListItemButton
                            key={item.id}
                            selected={selectedItem?.id === item.id}
                            onClick={() => setSelectedItem(item)}
                        >
                            <ListItemText primary={`${item.id}: ${item.name}`} />
                            <Button
                                size="small"
                                color="error"
                                onClick={(e) => handleDeleteItem(item, e)}
                            >
                                <DeleteIcon />
                            </Button>
                        </ListItemButton>
                    ))}
                </List>
            </Paper>

            {selectedItem && (
                <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Grid2 container spacing={2}>
                            <Grid2 size={{xs: 12}}>
                                <TextField
                                    label="名称"
                                    value={selectedItem.name}
                                    onChange={(e) => {
                                        const updated = { ...selectedItem, name: e.target.value };
                                        items[updated.id] = updated;
                                        GameData.setItemInfo(updated.id, updated);
                                        setSelectedItem(updated);
                                    }}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={{xs: 12}}>
                                <TextField
                                    label="描述"
                                    value={selectedItem.description}
                                    onChange={(e) => {
                                        const updated = { ...selectedItem, description: e.target.value };
                                        items[updated.id] = updated;
                                        GameData.setItemInfo(updated.id, updated);
                                        setSelectedItem(updated);
                                    }}
                                    multiline
                                    rows={3}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={{xs: 12}}>
                                <TextField
                                    label="价格"
                                    type="number"
                                    value={selectedItem.price}
                                    onChange={(e) => {
                                        const updated = { ...selectedItem, price: Number(e.target.value) };
                                        items[updated.id] = updated;
                                        GameData.setItemInfo(updated.id, updated);
                                        setSelectedItem(updated);
                                    }}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={{xs: 12}}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={selectedItem.cost}
                                            onChange={(e) => {
                                                const updated = { ...selectedItem, cost: e.target.checked };
                                                items[updated.id] = updated;
                                                GameData.setItemInfo(updated.id, updated);
                                                setSelectedItem(updated);
                                            }}
                                        />
                                    }
                                    label="可消耗"
                                />
                            </Grid2>
                        </Grid2>
                    </Box>
                    <Paper sx={{ width: '300px', p: 2 }}>
                        {renderImageSelector()}
                    </Paper>
                </Box>
            )}

            <FileSelector
                open={fileSelector.open}
                onClose={() => setFileSelector(prev => ({ ...prev, open: false }))}
                path={fileSelector.path}
                onSelect={handleFileSelect}
                multiple={false}
            />

            <SingleInput
                label="新建物品"
                inputType="物品名称"
                dialogOpen={newItemDialog}
                handleOnClose={() => setNewItemDialog(false)}
                content={newItemName}
                handleOnChange={(e) => setNewItemName(e.target.value)}
                handleSave={handleCreateItem}
            />

            <Hint
                snackbar={snackbar}
                handleOnClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            />
        </Box>
    );
}

export default ItemEditor;