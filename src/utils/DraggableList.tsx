import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItemButton,
    ListItemText,
    Box
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface DraggableListProps {
    items: Array<{
        id: string;
        label: string;
    }>;
    open: boolean;
    title?: string;
    onClose: () => void;
    onConfirm: (newItems: Array<{id: string; label: string}>) => void;
}

export default function DraggableList({
    items,
    open,
    title = "调整顺序",
    onClose,
    onConfirm
}: DraggableListProps) {
    const [orderedItems, setOrderedItems] = useState<Array<{id: string; label: string}>>(items);

    useEffect(() => {
        setOrderedItems(items);
    }, [items]);

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const newItems = Array.from(orderedItems);
        const [reorderedItem] = newItems.splice(result.source.index, 1);
        newItems.splice(result.destination.index, 0, reorderedItem);

        setOrderedItems(newItems);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="droppable">
                        {(provided) => (
                            <List
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {orderedItems.map((item, index) => (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                        {(provided) => (
                                            <ListItemButton
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                sx={{ display: 'flex', justifyContent: 'space-between' }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                    <Box {...provided.dragHandleProps} sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                                        <DragIndicatorIcon />
                                                    </Box>
                                                    <ListItemText primary={item.label} />
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
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>取消</Button>
                <Button onClick={() => {
                    onConfirm(orderedItems);
                    onClose();
                }} variant="contained">确认</Button>
            </DialogActions>
        </Dialog>
    );
}