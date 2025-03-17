import { useEffect, useState } from 'react'
import './App.css'
import { Box, List, ListItemButton, ListItemText, Paper, Button } from '@mui/material'
import SystemSetting from './SystemSetting'
import GameData, { Actor, Config } from './GameData'
import ActorEditor from './ActorEditor';
const fs = window.require('fs');
const path = window.require('path');
const { ipcRenderer } = window.require('electron');

function App() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [projectLoaded, setProjectLoaded] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    ipcRenderer.on('project-opened', (event: any, data: { path: string, config: any }) => {
      console.log(data.config);
      GameData.setRoot(data.path);
      setProjectLoaded(true);
      loadConfigs(data.path);
      loadActors(data.path);
      setRefreshKey(prev => prev + 1);
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
          // 转换数据结构
          actor.attributes = Object.entries(actor.attributes).map(([key, value]) => ({ key, value }));
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

  const handleOpenProject = () => {
    ipcRenderer.send('open-project');
  };

  const menuItems = ["地图编辑", "角色编辑", "道具编辑", "装备编辑", "敌人编辑", "图块编辑", "动画编辑", "公共事件", "系统设置"]
  const renderComponent = () => {
    switch (selectedIndex) {
      case 1:
        return <ActorEditor
          key={refreshKey}
          actors={GameData.getAllActorInfo()}
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
        // flex: 1,
        padding: 2,
        width: '80vw'
      }}>
        <Paper sx={{
          padding: 2
        }}>
          {renderComponent()}
        </Paper>
      </Box>
    </Box>
  )
}

export default App
