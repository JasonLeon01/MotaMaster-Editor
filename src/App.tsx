import { useEffect, useState, useCallback } from 'react'
import './App.css'
import { Box, List, ListItemButton, ListItemText, Paper, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, ListItem, ListItemIcon } from '@mui/material'
import SystemSetting from './SystemSetting'
import GameData, { Config, Actor, Item, Equip, GameDataRecorder, Enemy } from './GameData'
import ActorEditor from './ActorEditor';
import ItemEditor from 'ItemEditor'
import EquipEditor from './EquipEditor';
import Hint from 'utils/uHint'
import EnemyEditor from 'EnemyEditor'
const fs = window.require('fs');
const path = window.require('path');
const { ipcRenderer } = window.require('electron');

function App() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [projectLoaded, setProjectLoaded] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0);
  const [originalData, setOriginalData] = useState<GameDataRecorder>();
  const [saveDialog, setSaveDialog] = useState({
    open: false,
    changes: [] as { type: string; id: number; name: string }[]
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    ipcRenderer.on('project-opened', (event: any, data: { path: string, config: any }) => {
      console.log(data.config);
      if (data && data.config) {
        GameData.setRoot(data.path);
        setProjectLoaded(true);
        loadConfigs(data.path);
        loadActors(data.path);
        loadItems(data.path);
        loadEquips(data.path);
        loadEnemies(data.path);
        const origin = GameData.getCopyToAllData();
        setOriginalData(origin);
        setRefreshKey(prev => prev + 1);
      }
    });

    return () => {
      ipcRenderer.removeAllListeners('project-opened');
    };
  }, []);

  const loadConfigs = (rootPath: string) => {
    const configPath = path.join(rootPath, 'data', "configs");
    try {
      const systemFile = path.join(configPath, 'system.json');
      const systemData = fs.readFileSync(systemFile, 'utf8');
      const systemConfig = JSON.parse(systemData);

      Object.entries(systemConfig).forEach(([section, value]) => {
          GameData.setConfigAt(
            "system" as keyof Config,
            section as keyof Config[keyof Config],
            value as string | number | string[]
          );
      });

      const audioFile = path.join(configPath, 'audio.json');
      const audioData = fs.readFileSync(audioFile, 'utf8');
      const audioConfig = JSON.parse(audioData);

      Object.entries(audioConfig).forEach(([section, value]) => {
          GameData.setConfigAt(
            "audio" as keyof Config,
            section as keyof Config[keyof Config],
            value as string
          );
      });

    } catch (error) {
      console.error('Failed to load system config:', error);
    }
  }

  const loadActors = (rootPath: string) => {
    const actorsPath = path.join(rootPath, 'data', 'actors');
    try {
      const files = fs.readdirSync(actorsPath);
      const actorList: Actor[] = [];
      files.forEach((file: string) => {
        if (file.endsWith('.json')) {
          const data = fs.readFileSync(path.join(actorsPath, file), 'utf8');
          const actor = JSON.parse(data);
          actor.attr = Object.entries(actor.attr).map(([key, value]) => ({ key, value }));
          actor.wealth = Object.entries(actor.wealth).map(([key, value]) => ({ key, value }));
          actor.items = Object.entries(actor.items).map(([key, value]) => ({ key, value }));
          actorList.push(actor);
          GameData.setActorInfo(actor.id, actor);
        }
      });
    } catch (error) {
      console.error('Failed to load actors:', error);
    }
  };

  const loadItems = (rootPath: string) => {
    const itemsPath = path.join(rootPath, 'data', 'items');
    try {
      const files = fs.readdirSync(itemsPath);
      const itemList: Item[] = [];
      files.forEach((file: string) => {
        if (file.endsWith('.json')) {
          const data = fs.readFileSync(path.join(itemsPath, file), 'utf8');
          const item = JSON.parse(data);
          itemList.push(item);
          GameData.setItemInfo(item.id, item);
        }
      });
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  }

  const loadEquips = (rootPath: string) => {
    const equipsPath = path.join(rootPath, 'data', 'equips');
    try {
      const files = fs.readdirSync(equipsPath);
      const equipList: Equip[] = [];
      files.forEach((file: string) => {
        if (file.endsWith('.json')) {
          const data = fs.readFileSync(path.join(equipsPath, file), 'utf8');
          const equip = JSON.parse(data);
          equip.attr_plus = Object.entries(equip.attr_plus).map(([key, value]) => ({ key, value }));
          equipList.push(equip);
          GameData.setEquipInfo(equip.id, equip);
        }
      });
    } catch (error) {
      console.error('Failed to load equips:', error);
    }
  }

  const loadEnemies = (rootPath: string) => {
    const enemiesPath = path.join(rootPath, 'data', 'enemies');
    try {
      const files = fs.readdirSync(enemiesPath);
      const enemyList: Enemy[] = [];
      files.forEach((file: string) => {
        if (file.endsWith('.json')) {
          const data = fs.readFileSync(path.join(enemiesPath, file), 'utf8');
          const enemy = JSON.parse(data);
          enemy.attr = Object.entries(enemy.attr).map(([key, value]) => ({ key, value }));
          enemy.drop = Object.entries(enemy.drop).map(([key, value]) => ({ key, value }));
          enemyList.push(enemy);
          GameData.setEnemyInfo(enemy.id, enemy);
        }
      })
    } catch (error) {
      console.error('Failed to load enemies:', error);
    }
  }

  const handleOpenProject = () => {
    ipcRenderer.send('open-project');
  };

  const handleSaveProject = useCallback(() => {
    if (!originalData) return;
    const changes: { type: string; id: number; name: string }[] = [];

    if (JSON.stringify(originalData.getConfig()) !== JSON.stringify(GameData.getConfig())) {
      changes.push({ type: 'config', id: -1, name: '系统配置' });
    }

    const currentActors = GameData.getAllActorInfo().filter(a => a && a.id !== undefined);
    const originalActors = originalData.getAllActorInfo().filter(a => a && a.id !== undefined);

    originalActors.forEach(originalActor => {
      if (originalActor && originalActor.id != undefined && !currentActors.find(a => a.id === originalActor.id)) {
        changes.push({ type: 'actor', id: originalActor.id, name: `${originalActor.name}(-)` });
      }
    });

    currentActors.forEach(actor => {
      const originalActor = originalData.getActorInfo(actor.id);
      if (!originalActor) {
        changes.push({ type: 'actor', id: actor.id, name: `${actor.name}(+)` });
      } else if (JSON.stringify(originalActor) !== JSON.stringify(actor)) {
        changes.push({ type: 'actor', id: actor.id, name: actor.name });
      }
    });

    const currentItems = GameData.getAllItemInfo().filter(i => i && i.id !== undefined);
    const originalItems = originalData.getAllItemInfo().filter(i => i && i.id !== undefined);

    originalItems.forEach(originalItem => {
      if (originalItem && originalItem.id !=undefined && !currentItems.find(i => i.id === originalItem.id)) {
        changes.push({ type: 'item', id: originalItem.id, name: `${originalItem.name}(-))` });
      }
    });

    currentItems.forEach(item => {
      const originalItem = originalData.getItemInfo(item.id);
      if (!originalItem) {
        changes.push({ type: 'item', id: item.id, name: `${item.name}(+)` });
      } else if (JSON.stringify(originalItem) !== JSON.stringify(item)) {
        changes.push({ type: 'item', id: item.id, name: item.name });
      }
    });

    const currentEquips = GameData.getAllEquipInfo().filter(e => e && e.id !== undefined);
    const originalEquips = originalData.getAllEquipInfo().filter(e => e && e.id !== undefined);

    originalEquips.forEach(originalEquip => {
      if (originalEquip && originalEquip.id != undefined && !currentEquips.find(e => e.id === originalEquip.id)) {
        changes.push({ type: 'equip', id: originalEquip.id, name: `${originalEquip.name}(-)` });
      }
    });

    currentEquips.forEach(equip => {
      const originalEquip = originalData.getEquipInfo(equip.id);
      if (!originalEquip) {
        changes.push({ type: 'equip', id: equip.id, name: `${equip.name}(+)` });
      } else if (JSON.stringify(originalEquip) !== JSON.stringify(equip)) {
        changes.push({ type: 'equip', id: equip.id, name: equip.name });
      }
    });

    const currentEnemies = GameData.getAllEnemyInfo().filter(e => e && e.id!== undefined);
    const originalEnemies = originalData.getAllEnemyInfo().filter(e => e && e.id!== undefined);

    originalEnemies.forEach(originalEnemy => {
      if (originalEnemy && originalEnemy.id!= undefined &&!currentEnemies.find(e => e.id === originalEnemy.id)) {
        changes.push({ type: 'enemy', id: originalEnemy.id, name: `${originalEnemy.name}(-)` });
      }
    });

    currentEnemies.forEach(enemy => {
      const originalEnemy = originalData.getEnemyInfo(enemy.id);
      if (!originalEnemy) {
        changes.push({ type: 'enemy', id: enemy.id, name: `${enemy.name}(+)` });
      } else if (JSON.stringify(originalEnemy)!== JSON.stringify(enemy)) {
        changes.push({ type: 'enemy', id: enemy.id, name: enemy.name });
      }
    });

    if (changes.length === 0) {
      setSnackbar({
        open: true,
        message: '没有需要保存的更改',
        severity: 'info'
      });
      return;
    }
    setSaveDialog({
      open: true,
      changes
    });
  }, [originalData]);

  const handleConfirmSave = useCallback((selectedChanges: { type: string; id: number; name: string }[]) => {
    const rootPath = GameData.getRoot();
    if (!rootPath) return;

    try {
      if (selectedChanges.some(change => change.type === 'config')) {
        const configPath = path.join(rootPath, 'data', 'configs');
        fs.writeFileSync(
          path.join(configPath, 'system.json'),
          JSON.stringify(GameData.getConfig().system)
        );
        fs.writeFileSync(
          path.join(configPath, 'audio.json'),
          JSON.stringify(GameData.getConfig().audio)
        );
      }

      const actorChanges = selectedChanges.filter(change => change.type === 'actor');
      if (actorChanges.length > 0) {
        actorChanges.forEach(change => {
          if (change.name.endsWith('(-)')) {
            const filePath = path.join(rootPath, 'data', 'actors', `actor_${change.id}.json`);
            console.log('Deleting actor file:', filePath);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        });
        const currentActors = GameData.getAllActorInfo().filter(a => a && a.id !== undefined);
        currentActors.forEach(actor => {
          if (actorChanges.some(change => change.id === actor.id && !change.name.endsWith('(-)'))) {
            const saveActor = {
              ...actor,
              attr: actor.attr.reduce((obj, item) => ({
                ...obj,
                [item.key]: item.value
              }), {}),
              wealth: actor.wealth.reduce((obj, item) => ({
                ...obj,
                [item.key]: item.value
              }), {}),
              items: actor.items.reduce((obj, item) => ({
                ...obj,
                [item.key]: item.value
              }), {})
            };

            fs.writeFileSync(
              path.join(rootPath, 'data', 'actors', `actor_${actor.id}.json`),
              JSON.stringify(saveActor)
            );
          }
        });
      }

      const itemChanges = selectedChanges.filter(change => change.type === 'item');
      if (itemChanges.length > 0) {
        itemChanges.forEach(change => {
          if (change.name.endsWith('(-)')) {
            const filePath = path.join(rootPath, 'data', 'items', `item_${change.id}.json`);
            console.log('Deleting item file:', filePath);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        });
        const currentItems = GameData.getAllItemInfo().filter(i => i && i.id !== undefined);
        currentItems.forEach(item => {
          if (itemChanges.some(change => change.id === item.id && !change.name.endsWith('(-)'))) {
            fs.writeFileSync(
              path.join(rootPath, 'data', 'items', `item_${item.id}.json`),
              JSON.stringify(item)
            );
          }
        });
      }

      const equipChanges = selectedChanges.filter(change => change.type === 'equip');
      if (equipChanges.length > 0) {
        equipChanges.forEach(change => {
          if (change.name.endsWith('(-)')) {
            const filePath = path.join(rootPath, 'data', 'equips', `equip_${change.id}.json`);
            console.log('Deleting equip file:', filePath);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        });
        const currentEquips = GameData.getAllEquipInfo().filter(e => e && e.id !== undefined);
        currentEquips.forEach(equip => {
          if (equipChanges.some(change => change.id === equip.id && !change.name.endsWith('(-)'))) {
            const saveEquip = {
              ...equip,
              attr_plus: equip.attr_plus.reduce((obj, item) => ({
                ...obj,
                [item.key]: item.value
              }), {})
            };

            fs.writeFileSync(
              path.join(rootPath, 'data', 'equips', `equip_${equip.id}.json`),
              JSON.stringify(saveEquip)
            );
          }
        });
      }

      const enemyChanges = selectedChanges.filter(change => change.type === 'enemy');
      if (enemyChanges.length > 0) {
        enemyChanges.forEach(change => {
          if (change.name.endsWith('(-)')) {
            const filePath = path.join(rootPath, 'data', 'enemies', `enemy_${change.id}.json`);
            console.log('Deleting enemy file:', filePath);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        });
        const currentEnemies = GameData.getAllEnemyInfo().filter(e => e && e.id!== undefined);
        currentEnemies.forEach(enemy => {
          if (enemyChanges.some(change => change.id === enemy.id &&!change.name.endsWith('(-)'))) {
            const saveEnemy = {
             ...enemy,
              attr: enemy.attr.reduce((obj, item) => ({
               ...obj,
                [item.key]: item.value
              })),
              drop: enemy.drop.reduce((obj, item) => ({
              ...obj,
                [item.key]: item.value
              }), {})
            };

            fs.writeFileSync(
              path.join(rootPath, 'data', 'enemies', `enemy_${enemy.id}.json`),
              JSON.stringify(saveEnemy)
            );
          }
        });
      }

      setOriginalData(GameData.getCopyToAllData());
      setSnackbar({
        open: true,
        message: '保存成功！',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: '保存失败：' + (error as Error).message,
        severity: 'error'
      });
    } finally {
      setSaveDialog(prev => ({ ...prev, open: false }));
    }
  }, []);

  useEffect(() => {
    ipcRenderer.send('set-menu', {
      save: {
        label: '保存',
        accelerator: process.platform === 'darwin' ? 'Cmd+S' : 'Ctrl+S'
      }
    });

    ipcRenderer.on('menu-save', () => {
      handleSaveProject();
    });

    return () => {
      ipcRenderer.removeAllListeners('menu-save');
    };
  }, [handleSaveProject]);

  const menuItems = ["地图编辑", "角色编辑", "道具编辑", "装备编辑", "敌人编辑", "图块编辑", "动画编辑", "公共事件", "系统设置"]
  const renderComponent = () => {
    switch (selectedIndex) {
      case 1:
        return <ActorEditor
          key={refreshKey}
          actors={GameData.getAllActorInfo()}
          root={GameData.getRoot()}
        />;
      case 2:
          return <ItemEditor
              key={refreshKey}
              items={GameData.getAllItemInfo()}
              root={GameData.getRoot()}
          />;
      case 3:
          return <EquipEditor
              key={refreshKey}
              equips={GameData.getAllEquipInfo()}
              root={GameData.getRoot()}
          />;
      case 4:
          return <EnemyEditor
              key={refreshKey}
              enemies={GameData.getAllEnemyInfo()}
              root={GameData.getRoot()}
          />;
      case 8:
        return <SystemSetting
          key={refreshKey}
          configs={GameData.getConfig()}
          root={GameData.getRoot()}
        />;
    }
    return null;
  }

  useEffect(() => {

  }, [selectedIndex])

  if (!projectLoaded) {
    return (
      <Box sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleOpenProject}
          sx={{
            padding: '2rem 4rem',
            fontSize: '1.5rem'
          }}
        >
          打开工程
        </Button>
      </Box>
    );
  }

  const SaveDialog = () => {
    const [selectedChanges, setSelectedChanges] = useState<{ type: string; id: number; name: string }[]>([]);

    useEffect(() => {
      setSelectedChanges(saveDialog.changes);
    }, [saveDialog.changes]);

    const handleToggle = (change: { type: string; id: number; name: string }) => {
      setSelectedChanges(prev => {
        const exists = prev.find(item => item.type === change.type && item.id === change.id);
        if (exists) {
          return prev.filter(item => item.type !== change.type || item.id !== change.id);
        }
        return [...prev, change];
      });
    };

    return (
      <Dialog open={saveDialog.open} onClose={() => setSaveDialog(prev => ({ ...prev, open: false }))}>
        <DialogTitle>确认保存更改</DialogTitle>
        <DialogContent>
          <List>
            {saveDialog.changes.map((change) => (
              <ListItem key={`${change.type}-${change.id}`}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedChanges.some(item => item.type === change.type && item.id === change.id)}
                    onChange={() => handleToggle(change)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`${change.name} (${change.type === 'config' ? '配置' :
                    change.type === 'actor' ? '角色' :
                    change.type === 'item' ? '物品' :
                    change.type === 'equip'? '装备' :
                    change.type === 'enemy'? '敌人' :
                    '未知'})`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog(prev => ({ ...prev, open: false }))}>取消</Button>
          <Button onClick={() => handleConfirmSave(selectedChanges)} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
    }}>
      <Box sx={{
        width: '10vw',
        borderRight: '1px solid #ccc',
        padding: 2,
        boxSizing: 'border-box'
      }}>
        <List sx={{
          padding: 2,
          margin: 0,
          textAlign: 'left'
        }}>
          {menuItems.map((item, index) => (
            <ListItemButton
              key={item}
              selected={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
              sx={{
                textAlign: 'left',
                paddingLeft: 2,
                paddingRight: 2
              }}
            >
              <ListItemText primary={item} />
            </ListItemButton>
          ))}
        </List>
      </Box>
      <Box sx={{
        padding: 2,
        width: '80vw'
      }}>
        <Paper sx={{
          padding: 2
        }}>
          {renderComponent()}
        </Paper>
      </Box>
      <SaveDialog />
      <Hint
        snackbar={snackbar}
        handleOnClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </Box>
  )
}

export default App
