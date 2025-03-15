import { Box, Button, Grid2, Paper, TextField, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import GameData from "./GameData";
import FileSelector from './FileSelector';

function SystemSetting() {
    const [systemData, setSystemData] = useState<{ [key: string]: string | string[] }>({});
    const [showFileSelector, setShowFileSelector] = useState(false);
    const [currentPath, setCurrentPath] = useState("");
    const [currentKey, setCurrentKey] = useState("");
    const [isMultiple, setIsMultiple] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'warning' as 'warning' | 'error' });

    const columns = [
        [
            { label: "标题名", editable: true, path: "", multiple: false },
            { label: "标题ICON", editable: false, path: "assets/system/", multiple: false },
            { label: "标题背景", editable: false, path: "assets/system/", multiple: false },
            { label: "标题BGM", editable: false, path: "assets/musics/", multiple: false },
            { label: "字体文件", editable: false, path: "assets/fonts/", multiple: true },
            { label: "默认字号", editable: true, path: "", multiple: false },
            { label: "窗口风格", editable: false, path: "assets/system/", multiple: false },
            { label: "窗口默认不透明度", editable: true, path: "", multiple: false },
            { label: "窗口背景模式", editable: true, path: "", multiple: false },
        ],
        [
            { label: "选择SE", editable: false, path: "assets/sounds", multiple: false },
            { label: "确认SE", editable: false, path: "assets/sounds", multiple: false },
            { label: "取消SE", editable: false, path: "assets/sounds", multiple: false },
            { label: "警告SE", editable: false, path: "assets/sounds", multiple: false },
            { label: "商店SE", editable: false, path: "assets/sounds", multiple: false },
            { label: "装备SE", editable: false, path: "assets/sounds", multiple: false },
            { label: "保存SE", editable: false, path: "assets/sounds", multiple: false },
            { label: "读取SE", editable: false, path: "assets/sounds", multiple: false },
            { label: "开门SE", editable: false, path: "assets/sounds", multiple: false },
            { label: "楼梯SE", editable: false, path: "assets/sounds", multiple: false },
            { label: "物品获取SE", editable: false, path: "assets/sounds" }
        ]
    ];

    const openFileSelector = (path: string, key: string, multiple: boolean) => {
        const fullPath = path ? `${GameData.getRoot()}/${path}` : GameData.getRoot();
        setCurrentPath(fullPath.replace(/\/\//g, '/'));
        setCurrentKey(key);
        setIsMultiple(multiple);
        setShowFileSelector(true);
    };

    const handleFileSelection = (files: string[]) => {
        setSystemData(prev => ({
            ...prev,
            [currentKey]: files
        }));
    };

    const judgeValue = (label: string, value: string) => {
        if (label === "默认字号") {
            if (value!== '') {
                if (!/^\d+$/.test(value)) {
                    setSnackbar({
                        open: true,
                        message: '请输入有效的数字',
                        severity: 'warning'
                    });
                    return false;
                }
                if (parseInt(value) > 64) {
                    setSnackbar({
                        open: true,
                        message: '字号不能大于64',
                        severity: 'warning'
                    });
                    return false;
                }
            }
        }

        if (label === "窗口默认不透明度") {
            if (value!== '') {
                if (!/^\d+$/.test(value)) {
                    setSnackbar({
                        open: true,
                        message: '请输入有效的数字',
                        severity: 'warning'
                    });
                    return false;
                }
                if (parseInt(value) > 255) {
                    setSnackbar({
                        open: true,
                        message: '不透明度不能大于255',
                        severity: 'warning'
                    });
                    return false;
                }
            }
        }

        return true;
    }

    const handleTextChange = (key: string, value: string, item: any) => {
       if (!judgeValue(item.label, value)) {
           return;
       }
        setSystemData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <Box sx={{ p: 2 }}>
            <Grid2 container spacing={2}>
                {columns.map((column, columnIndex) => (
                    <Grid2
                        size={{
                            xs: 6
                        }}
                        key={columnIndex}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {column.map((item, itemIndex) => {
                                const key = `${columnIndex}-${itemIndex}`;
                                return (
                                    <Box
                                        key={itemIndex}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        <TextField
                                            label={item.label}
                                            variant="outlined"
                                            value={
                                                Array.isArray(systemData[key])
                                                    ? (systemData[key] as string[]).join(', ')
                                                    : (typeof systemData[key] === 'string'
                                                        ? systemData[key]
                                                        : "")
                                            }
                                            onChange={(e) => item.editable && handleTextChange(key, e.target.value, item)}
                                            disabled={!item.editable}
                                            sx={{ flex: 1 }}
                                        />
                                        {!item.editable && (
                                            <Button
                                                variant="contained"
                                                onClick={() => openFileSelector(item.path, key, item.multiple || false)}
                                            >
                                                选择文件
                                            </Button>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    </Grid2>
                ))}
            </Grid2>
            <FileSelector
                open={showFileSelector}
                onClose={() => setShowFileSelector(false)}
                path={currentPath}
                onSelect={handleFileSelection}
                multiple={isMultiple}
            />
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
export default SystemSetting;