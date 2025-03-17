import { Box, Button, Grid2, Paper, TextField, Snackbar, Alert } from "@mui/material";
import { useEffect, useState } from "react";
import GameData, { Config } from "./GameData";
import FileSelector from './utils/FileSelector';
import Hint from "./utils/uHint";

interface SystemSettingProps {
    configs: Config;
    root: string;
}

function SystemSetting({ configs, root }: SystemSettingProps) {
    const [systemData, setSystemData] = useState<{ [key: string]: string | number | string[] }>({});
    const [showFileSelector, setShowFileSelector] = useState(false);
    const [currentPath, setCurrentPath] = useState("");
    const [currentKey, setCurrentKey] = useState("");
    const [isMultiple, setIsMultiple] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        severity: 'success' | 'info' | 'warning' | 'error';
        message: string;
    }>({ open: false, message: '', severity: 'warning' });

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

    useEffect(() => {
        const initialData: { [key: string]: string | number | string[] } = {};
        columns.forEach((column, columnIndex) => {
            column.forEach((item, itemIndex) => {
                const key = `${columnIndex}-${itemIndex}`;
                if (columnIndex === 0) {
                    // system 配置
                    const configKey = getConfigKey(item.label, 'system');
                    if (configKey) {
                        if (typeof configs.system[configKey as keyof typeof configs.system] === 'string') {
                            initialData[key] = configs.system[configKey as keyof typeof configs.system] || '';
                        }
                        else if (typeof configs.system[configKey as keyof typeof configs.system] === 'number') {
                            initialData[key] = configs.system[configKey as keyof typeof configs.system].toString();
                        }
                        else if (Array.isArray(configs.system[configKey as keyof typeof configs.system])) {
                            initialData[key] = configs.system[configKey as keyof typeof configs.system];
                        }
                    }
                } else if (columnIndex === 1) {
                    const configKey = getConfigKey(item.label, 'audio');
                    if (configKey) {
                        initialData[key] = configs.audio[configKey as keyof typeof configs.audio] || '';
                    }
                }
            });
        });
        setSystemData(initialData);
    }, []);

    const getConfigKey = (label: string, section: 'system' | 'audio'): string | null => {
        const keyMap: { [key: string]: { section: 'system' | 'audio', key: string } } = {
            "标题名": { section: 'system', key: 'title_name' },
            "标题ICON": { section: 'system', key: 'title_icon' },
            "标题背景": { section: 'system', key: 'title_file' },
            "标题BGM": { section: 'system', key: 'title_bgm' },
            "字体文件": { section: 'system', key: 'font_name' },
            "默认字号": { section: 'system', key: 'font_size' },
            "窗口风格": { section: 'system', key: 'windowskin_file' },
            "窗口默认不透明度": { section: 'system', key: 'window_opacity' },
            "选择SE": { section: 'audio', key: 'cursor_se' },
            "确认SE": { section: 'audio', key: 'decision_se' },
            "取消SE": { section: 'audio', key: 'cancel_se' },
            "警告SE": { section: 'audio', key: 'buzzer_se' },
            "商店SE": { section: 'audio', key: 'shop_se' },
            "装备SE": { section: 'audio', key: 'equip_se' },
            "保存SE": { section: 'audio', key: 'save_se' },
            "读取SE": { section: 'audio', key: 'load_se' },
            "开门SE": { section: 'audio', key: 'gate_se' },
            "楼梯SE": { section: 'audio', key: 'stair_se' },
            "物品获取SE": { section: 'audio', key: 'get_se' }
        };

        const mapping = keyMap[label];
        return mapping && mapping.section === section ? mapping.key : null;
    };

    const openFileSelector = (path: string, key: string, multiple: boolean) => {
        const fullPath = path ? `${root}/${path}` : root;
        setCurrentPath(fullPath.replace(/\/\//g, '/'));
        setCurrentKey(key);
        setIsMultiple(multiple);
        setShowFileSelector(true);
    };

    const handleFileSelection = (files: string[]) => {
        const [columnIndex, itemIndex] = currentKey.split('-').map(Number);
        const item = columns[columnIndex][itemIndex];
        const configKey = getConfigKey(
            item.label,
            columnIndex === 0 ? 'system' : 'audio'
        );
        const value = files.length === 1 ? files[0] : files;
        setSystemData(prev => ({
            ...prev,
            [currentKey]: files
        }));
        if (configKey) {
            if (columnIndex === 0) {
                configs.system[configKey as keyof typeof configs.system] = value as never;
            } else {
                configs.audio[configKey as keyof typeof configs.audio] = value as never;
            }
            GameData.setConfig(configs);
        }
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
        const [columnIndex, itemIndex] = key.split('-').map(Number);
        const configKey = getConfigKey(
            item.label,
            columnIndex === 0 ? 'system' : 'audio'
        );
        if (configKey) {
            if (columnIndex === 0) {
                configs.system[configKey as keyof typeof configs.system] = value as never;
            } else {
                configs.audio[configKey as keyof typeof configs.audio] = value as never;
            }
            GameData.setConfig(configs);
        }
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
                                                ...
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
            <Hint
                snackbar={snackbar}
                handleOnClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            />
        </Box>
    );
}
export default SystemSetting;