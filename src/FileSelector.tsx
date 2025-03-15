import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Paper, List, ListItem, ListItemText, ButtonBase } from '@mui/material';
import { ipcRenderer } from 'electron';

interface FileSelectorProps {
    open: boolean;
    onClose: () => void;
    path: string;
    onSelect: (files: string[]) => void;
    multiple: boolean;
}

const FileSelector: React.FC<FileSelectorProps> = ({ open, onClose, path, onSelect, multiple }) => {
    const [filesInFolder, setFilesInFolder] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (open) {
            setSelectedFiles([]);
            ipcRenderer.send('read-folder', path);

            const handleFolderContent = (event: any, files: string[]) => {
                setFilesInFolder(files);
            };

            ipcRenderer.on('folder-content', handleFolderContent);

            return () => {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                ipcRenderer.removeListener('folder-content', handleFolderContent);
            };
        }
    }, [open, path]);

    if (!open) return null;

    const handleFileSelect = (file: string) => {
        if (multiple) {
            setSelectedFiles(prev =>
                prev.includes(file)
                    ? prev.filter(f => f !== file)
                    : [...prev, file]
            );
        } else {
            setSelectedFiles([file]);
        }
    };

    const handleConfirm = () => {
        onSelect(selectedFiles);
        onClose();
    };

    const renderPreview = () => {
        if (selectedFiles.length === 0) return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
            }}>
                <p>请选择文件</p>
            </Box>
        );

        const file = selectedFiles[0];
        const ext = file.split('.').pop()?.toLowerCase();
        const filePath = `${path}/${file}`.replace(/\\/g, '/');

        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
            return (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                }}>
                    <img
                        src={`file://${filePath}`}
                        alt="Preview"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            objectFit: 'contain'
                        }}
                    />
                </Box>
            );
        } else if (['mp3', 'wav', 'ogg'].includes(ext || '')) {
            return (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                }}>
                    <audio
                        ref={audioRef}
                        controls
                        src={`file://${filePath}`}
                        style={{
                            width: '80%'
                        }}
                    />
                </Box>
            );
        }

        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
            }}>
                <p>不可预览</p>
            </Box>
        );
    };

    return (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <Paper sx={{
                padding: 2,
                width: '80%',
                height: '80%',
                display: 'flex'
            }}>
                <Box sx={{ width: '30%', overflowY: 'auto' }}>
                    <List>
                        {filesInFolder.map((file, index) => (
                            <ButtonBase
                                key={index}
                                onClick={() => handleFileSelect(file)}
                                style={{ width: '100%' }}
                            >
                                <ListItem
                                    sx={{
                                        backgroundColor: selectedFiles.includes(file)
                                            ? 'rgba(0, 0, 0, 0.08)'
                                            : 'inherit',
                                        width: '100%'
                                    }}
                                >
                                    <ListItemText primary={file} />
                                </ListItem>
                            </ButtonBase>
                        ))}
                    </List>
                </Box>
                <Box sx={{
                    width: '70%',
                    paddingLeft: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    <Box sx={{ flex: 1 }}>
                        {renderPreview()}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" onClick={() => {
                            handleConfirm();
                            setSelectedFiles([]);
                            }
                        }>
                            确认选择
                        </Button>
                        <Button variant="outlined" onClick={() => {
                                setSelectedFiles([]);
                                onClose();
                            }
                        }>
                            取消
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default FileSelector;