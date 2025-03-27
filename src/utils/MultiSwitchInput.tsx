import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Radio, RadioGroup } from "@mui/material";

interface MultiSwitchInputProps {
    label: string;
    dialogOpen: boolean;
    handleOnClose: () => void;
    lists: { label: string, value: boolean }[];
    handleOnChange: (index: number, value: boolean) => void;
    handleSave: () => void;
}

const MultiSwitchInput: React.FC<MultiSwitchInputProps> = ({ label, dialogOpen, handleOnClose, lists, handleOnChange, handleSave }) => {
    return (
        <Dialog open={dialogOpen} onClose={handleOnClose}>
            <DialogTitle>{label}</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    {lists.map((lists, index) => (
                        <FormControl key={lists.label} fullWidth sx={{ mb: 2 }}>
                            {lists.label}
                            <RadioGroup
                                row
                                value={lists.value.toString()}
                                onChange={(e) => handleOnChange(index, e.target.value === 'true')}
                            >
                                <FormControlLabel
                                    value="true"
                                    control={<Radio />}
                                    label={`on`}
                                />
                                <FormControlLabel
                                    value="false"
                                    control={<Radio />}
                                    label={`off`}
                                />
                            </RadioGroup>
                        </FormControl>
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleOnClose}>取消</Button>
                <Button onClick={handleSave} variant="contained">确认</Button>
            </DialogActions>
        </Dialog>
    );
}

export default MultiSwitchInput;