#!/bin/bash

# 启动 React 开发服务器
cd "$(dirname "$0")" && sudo npm start &

# 等待 React 开发服务器启动
while ! curl -s http://localhost:3000 > /dev/null; do
  sleep 2
done

# 启动 Electron
cd "$(dirname "$0")" && npm run electron
