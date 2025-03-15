// electron/main.js
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

ipcMain.on('read-folder', (event, folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);
        event.reply('folder-content', files);
    } catch (error) {
        event.reply('folder-content', []);
    }
});

ipcMain.on('open-project', (event) => {
    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        properties: ['openFile'],
        filters: [
            { name: 'MotaMaster Project', extensions: ['mtproj'] }
        ]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            const projectPath = path.dirname(result.filePaths[0]);
            const projectFile = result.filePaths[0];
            try {
                const projectData = fs.readFileSync(projectFile, 'utf8');
                const projectConfig = JSON.parse(projectData);
                event.reply('project-opened', {
                    path: projectPath,
                    config: projectConfig
                });
            } catch (error) {
                dialog.showErrorBox('错误', '无法读取项目文件');
            }
        }
    });
});

// 添加菜单模板配置
const template = [
    {
        label: '文件',
        submenu: [
            {
                label: '打开项目',
                click: () => {
                    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
                        properties: ['openFile'],
                        filters: [
                            { name: 'MotaMaster Project', extensions: ['mtproj'] }
                        ]
                    }).then(result => {
                        if (!result.canceled && result.filePaths.length > 0) {
                            const projectPath = path.dirname(result.filePaths[0]);
                            const projectFile = result.filePaths[0];
                            try {
                                const projectData = fs.readFileSync(projectFile, 'utf8');
                                const projectConfig = JSON.parse(projectData);
                                BrowserWindow.getFocusedWindow().webContents.send('project-opened', {
                                    path: projectPath,
                                    config: projectConfig
                                });
                            } catch (error) {
                                dialog.showErrorBox('错误', '无法读取项目文件');
                            }
                        }
                    });
                }
            },
            { type: 'separator' },
            { role: 'quit', label: '退出' }
        ]
    }
];

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            enableRemoteModule: true
        }
    });

    // 设置应用菜单
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    mainWindow.loadURL('http://localhost:3000');

    // 添加热更新支持
    try {
        require('electron-reloader')(module, {
            debug: true,
            watchRenderer: true
        });
    } catch (_) { }

    // 修改 DevTools 配置
    mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.webContents.executeJavaScript(`
            delete window.Autofill;
        `);
    });

    mainWindow.webContents.openDevTools();
    mainWindow.maximize();

    return mainWindow;
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});