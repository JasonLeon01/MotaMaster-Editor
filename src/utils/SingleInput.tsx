import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";

interface SingleInputProps {
    label: string;
    inputType: string;
    dialogOpen: boolean;
    handleOnClose: () => void;
    content: string;
    handleOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSave: () => void;
}

const SingleInput: React.FC<SingleInputProps> = ({ label, inputType, dialogOpen, handleOnClose, content, handleOnChange, handleSave }) => {
    return (
        <Dialog open={dialogOpen} onClose={handleOnClose}>
            <DialogTitle>{label}</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <TextField
                        label={inputType}
                        value={content}
                        onChange={handleOnChange}
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleOnClose}>取消</Button>
                <Button onClick={handleSave} variant="contained">确认</Button>
            </DialogActions>
        </Dialog>
    );
}

export default SingleInput;