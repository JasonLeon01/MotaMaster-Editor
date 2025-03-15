import { useEffect, useState } from 'react'
import './App.css'
import { Box, List, ListItemButton, ListItemText, Paper, Button } from '@mui/material'
import SystemSetting from './SystemSetting'
import GameData from './GameData'

const { ipcRenderer } = window.require('electron');

function App() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [projectLoaded, setProjectLoaded] = useState(false)

  useEffect(() => {
    ipcRenderer.on('project-opened', (event: any, data: { path: string, config: any }) => {
      GameData.setRoot(data.path);
      console.log(data.config);
      setProjectLoaded(true);
    });

    return () => {
      ipcRenderer.removeAllListeners('project-opened');
    };
  }, []);

  const handleOpenProject = () => {
    ipcRenderer.send('open-project');
  };

  const menuItems = ["地图编辑", "角色编辑", "道具编辑", "装备编辑", "敌人编辑", "图块编辑", "动画编辑", "公共事件", "系统设置"]
  const renderComponent = () => {
    switch (selectedIndex) {
      case 8:
        return <SystemSetting />
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
