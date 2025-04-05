import { Dialog, List, ListItemButton, ListItemText } from '@mui/material';

interface SelectionListProps {
    open: boolean;
    items: string[];
    onClose: () => void;
    onSelect: (item: string) => void;
}

const SelectionList: React.FC<SelectionListProps> = ({ open, items, onClose, onSelect }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <List sx={{ minWidth: 200 }}>
                {items.map((item, index) => (
                    <ListItemButton key={index} onClick={() => {
                        onSelect(item);
                        onClose();
                    }}>
                        <ListItemText primary={item} />
                    </ListItemButton>
                ))}
            </List>
        </Dialog>
    );
};

export default SelectionList;