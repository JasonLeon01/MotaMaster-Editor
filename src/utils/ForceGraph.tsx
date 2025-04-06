import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Event } from '../GameData';
import SelectionList from './SelectionList';
import { PythonParser } from './NodeParser';
import path from 'path';
import fs from 'fs';

interface ForceGraphProps {
    root: string;
    event: Event | null;
}

interface GraphNode {
    id: string;
    name: string;
    paramsName: string[];
    params: string[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    padding?: number;
    lineHeight?: number;
}

interface GraphLink {
    source: string;
    target: string;
}

interface CommandNode {
    filename: string;
    name: string;
    params: string[];
    nexts: string[];
}

const ForceGraph: React.FC<ForceGraphProps> = ({ root, event }) => {
    const [commandNodes, setCommandNodes] = useState<CommandNode[]>([]);
    const [selectionOpen, setSelectionOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [links, setLinks] = useState<GraphLink[]>([]);
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
    const [connectingPort, setConnectingPort] = useState<{
        sourceNode: GraphNode;
        portIndex: number;
    } | null>(null);
    const [draggingPort, setDraggingPort] = useState<{
        sourceNode: GraphNode;
        portIndex: number;
    } | null>(null);

    useEffect(() => {
        setNodes([{
            id: '0',
            name: 'Root',
            paramsName: [],
            params: []
        }]);
    }, []);

    useEffect(() => {
        const loadCommandNodes = async () => {
            const commandsPath = path.join(root, 'data', 'commands');
            try {
                const files = fs.readdirSync(commandsPath);
                const pythonFiles = files.filter(file => file.endsWith('.py'));

                const nodes = await Promise.all(pythonFiles.map(async file => {
                    const filePath = path.join(commandsPath, file);
                    const result = await PythonParser(filePath);
                    return {
                        filename: file.replace('.py', ''),
                        name: result.name,
                        params: result.params,
                        nexts: result.nexts
                    };
                }));

                setCommandNodes(nodes);
            } catch (error) {
                console.error('Error loading command nodes:', error);
            }
        };

        if (root) {
            loadCommandNodes();
        }
    }, [root]);

    const graphData = useMemo(() => {
        if (!event || !commandNodes.length) {
            return { nodes, links };
        }

        const newNodes: GraphNode[] = event.orders.map((order, index) => ({
            id: order.id,
            name: order.id,
            paramsName: commandNodes.find(node => node.filename === order.id)?.params || [],
            params: order.params
        }));

        const newLinks: GraphLink[] = [];
        if (event.adjacency) {
            const { from, to } = event.adjacency;
            to.forEach(targetId => {
                newLinks.push({
                    source: from.toString(),
                    target: targetId.toString()
                });
            });
        }

        setNodes(newNodes);
        setLinks(newLinks);
        return { nodes: newNodes, links: newLinks };
    }, [event, nodes, links, commandNodes.length, commandNodes]);

    const handleContextMenu = useCallback((event: MouseEvent) => {
        event.preventDefault();
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        setSelectionOpen(true);
    }, []);

    const handleNodeSelect = useCallback((selectedName: string) => {
        const selectedNode = commandNodes.find(node =>
            node.name === selectedName
        );

        if (!selectedNode) return;

        const newNode: GraphNode = {
            id: (nodes.length).toString(),
            name: selectedNode.name,
            paramsName: selectedNode.params,
            params: [...Array(selectedNode.params.length)].map(() => '')
        };
        console.log(newNode);

        setNodes(prevNodes => [...prevNodes, newNode]);
    }, [nodes.length, commandNodes]);

    const isOverPort = useCallback((node: GraphNode, x: number, y: number, portIndex: number) => {
        const portRadius = 10;
        if (node.x !== undefined && node.y !== undefined && node.width !== undefined && node.height !== undefined) {
            if (node.name === 'Root') {
                const portX = node.x + node.width/2;
                const portY = node.y;
                const distance = Math.sqrt(Math.pow(x - portX, 2) + Math.pow(y - portY, 2));
                console.log('Root port distance:', distance, 'threshold:', portRadius, 'at:', portX, portY);
                return distance <= portRadius;
            } else {
                const nextsCount = commandNodes.find(n => n.name === node.name)?.nexts.length || 0;
                if (portIndex >= nextsCount) return false;

                const portSpacing = node.height / (nextsCount + 1);
                const portX = node.x + node.width/2;
                const portY = node.y - node.height/2 + portSpacing * (portIndex + 1);
                const distance = Math.sqrt(Math.pow(x - portX, 2) + Math.pow(y - portY, 2));
                console.log('Port distance:', distance, 'threshold:', portRadius, 'at:', portX, portY);
                return distance <= portRadius;
            }
        }
        return false;
    }, [commandNodes]);

    const handleNodeMouseDown = useCallback((node: GraphNode, event: any) => {
        event.preventDefault();
        event.stopPropagation();

        if (connectingPort) {
            setLinks(prevLinks => [...prevLinks, {
                source: connectingPort.sourceNode.id,
                target: node.id
            }]);
            setConnectingPort(null);
            setMousePos(null);
            return;
        }

        if (!node.x || !node.y) return;

        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        const transform = canvas.getContext('2d').getTransform();

        const mouseX = (event.clientX - rect.left - rect.width/2) / transform.a;
        const mouseY = (event.clientY - rect.top - rect.height/2) / transform.d;

        console.log('Node position:', node.x, node.y);
        console.log('Mouse position:', mouseX, mouseY);

        const nextsCount = commandNodes.find(n => n.name === node.name)?.nexts.length || 0;

        for (let i = 0; i < nextsCount; i++) {
            if (isOverPort(node, mouseX, mouseY, i)) {
                console.log('Port hit:', i);
                setConnectingPort({ sourceNode: node, portIndex: i });
                setMousePos({ x: mouseX, y: mouseY });
                return;
            }
        }
    }, [commandNodes, isOverPort, connectingPort]);

    const handleBackgroundClick = useCallback((event: any) => {
        if (connectingPort) {
            setConnectingPort(null);
            setMousePos(null);
        }
    }, [connectingPort]);

    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const fontSize = 12/globalScale;
        ctx.font = `${fontSize}px Arial`;

        const paramLines = [
            node.name,
            ...node.paramsName.map((name: string, index: number) =>
                `${name}: ${node.params[index] || ''}`)
        ];

        const commandNode = commandNodes.find(n => n.name === node.name);
        const nexts = commandNode?.nexts || [];

        const padding = fontSize;
        const lineHeight = fontSize * 1.2;
        const paramsWidth = Math.max(...paramLines.map(line => ctx.measureText(line).width));

        const nextsWidth = nexts.length > 0
            ? Math.max(...nexts.map(next => ctx.measureText(next).width)) + padding * 2
            : 0;

        const textWidth = paramsWidth;
        const baseHeight = paramLines.length * lineHeight + padding * 2;
        const boxWidth = textWidth + padding * 2 + (nexts.length > 0 ? nextsWidth : 0);
        const boxHeight = Math.max(
            baseHeight,
            nexts.length > 0 ? (nexts.length + 1) * (baseHeight / (nexts.length + 1)) : 0
        );


        node.width = boxWidth;
        node.height = boxHeight;
        node.padding = padding;
        node.lineHeight = lineHeight;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(
            node.x - boxWidth/2,
            node.y - boxHeight/2,
            boxWidth,
            boxHeight
        );

        ctx.strokeStyle = '#2B7CE9';
        ctx.strokeRect(
            node.x - boxWidth/2,
            node.y - boxHeight/2,
            boxWidth,
            boxHeight
        );

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        paramLines.forEach((line, index) => {
            const y = node.y - boxHeight/2 + padding + lineHeight * (index + 0.5);
            const x = node.x - boxWidth/2 + padding;
            ctx.fillText(line, x, y);
        });

        if (node.name === 'Root') {
            const portX = node.x + boxWidth/2;
            const portY = node.y;
            ctx.beginPath();
            ctx.arc(portX, portY, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
        else if (nexts.length > 0) {
            const portSpacing = boxHeight / (nexts.length + 1);
            nexts.forEach((next, i) => {
                const portX = node.x + boxWidth/2;
                const portY = node.y - boxHeight/2 + portSpacing * (i + 1);

                ctx.beginPath();
                ctx.arc(portX, portY, 3, 0, 2 * Math.PI);
                ctx.fill();

                ctx.textAlign = 'left';
                ctx.fillStyle = 'black';
                const labelX = node.x - boxWidth/2 + padding + textWidth + padding * 2;
                ctx.fillText(next, labelX, portY);
            });
        }

        if (connectingPort && connectingPort.sourceNode.id === node.id && mousePos) {
            const sourceNode = connectingPort.sourceNode;
            const portSpacing = boxHeight / (nexts.length + 1);
            if (sourceNode.x && sourceNode.y && sourceNode.width && sourceNode.height) {
                const startX = sourceNode.x + sourceNode.width/2;
                const startY = sourceNode.y - sourceNode.height/2 + portSpacing * (connectingPort.portIndex + 1);

                ctx.beginPath();
                ctx.strokeStyle = '#2B7CE9';
                ctx.setLineDash([5, 5]);
                ctx.moveTo(startX, startY);
                ctx.lineTo(mousePos.x, mousePos.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }, [commandNodes, draggingPort, mousePos]);

    return (
        <>
            <ForceGraph2D
                width={window.innerWidth * 0.4}
                height={window.innerHeight * 0.6}
                graphData={graphData}
                nodeLabel="name"
                nodeCanvasObject={nodeCanvasObject}
                nodeCanvasObjectMode={() => 'after'}
                nodeVal={(node: any) => {
                    return Math.sqrt(Math.pow(node.width || 0, 2) + Math.pow(node.height || 0, 2));
                }}
                onNodeClick={handleNodeMouseDown}
                onBackgroundClick={handleBackgroundClick}
                onNodeDrag={(node, translate) => {
                    if (connectingPort) {
                        return false;
                    }
                }}
                onBackgroundRightClick={handleContextMenu}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                cooldownTicks={100}
                d3VelocityDecay={0.3}
                nodeRelSize={3}
                dagMode="td"
                dagLevelDistance={100}
            />
            <SelectionList
                open={selectionOpen}
                items={commandNodes.map(node => `${node.name}`)}
                onClose={() => setSelectionOpen(false)}
                onSelect={handleNodeSelect}
            />
        </>
    );
};

export default ForceGraph;