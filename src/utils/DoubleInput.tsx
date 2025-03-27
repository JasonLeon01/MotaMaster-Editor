import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";

interface DoubleInputProps {
    mapName: string;
    mapKeyName: string;
    mapValueName: string;
    dialogOpen: boolean;
    handleOnClose: () => void;
    editingField: {
        type: 'attr' | 'wealth' | 'items',
        key: string,
        originalKey: string,
        value: number
    } | null;
    handleKeyOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleValueOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSave: () => void;
}

const DoubleInput: React.FC<DoubleInputProps> = ({ mapName, mapKeyName, mapValueName, dialogOpen, handleOnClose, editingField, handleKeyOnChange, handleValueOnChange, handleSave }) => {
    return (
        <Dialog open={dialogOpen} onClose={handleOnClose}>
            <DialogTitle>{mapName}</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <TextField
                        label={mapKeyName}
                        value={editingField?.key || ''}
                        onChange={handleKeyOnChange}
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label={mapValueName}
                        type="number"
                        value={editingField?.value || 0}
                        onChange={ handleValueOnChange}
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={ handleOnClose }>取消</Button>
                <Button onClick={handleSave} variant="contained">保存</Button>
            </DialogActions>
        </Dialog>
    );
}

export default DoubleInput;