import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";

interface Option {
    value: number;
    label: string;
}

interface ComboBoxProps {
    label: string;
    value: number;
    options: Option[];
    onChange: (value: number) => void;
}

const ComboBox: React.FC<ComboBoxProps> = ({ label, value, options, onChange }) => {
    const handleChange = (event: SelectChangeEvent<number>) => {
        onChange(Number(event.target.value));
    };

    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select
                value={value}
                label={label}
                onChange={handleChange}
            >
                <MenuItem value={0}></MenuItem>
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default ComboBox;