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
    nextsCount: number;
}

const ForceGraph: React.FC<ForceGraphProps> = ({ root, event }) => {
    const [commandNodes, setCommandNodes] = useState<CommandNode[]>([]);
    const [selectionOpen, setSelectionOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [links, setLinks] = useState<GraphLink[]>([]);
    const [draggingPort, setDraggingPort] = useState<{
        nodeId: string;
        isInput: boolean;
        index: number;
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
                        nextsCount: result.nextsCount
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
        const portRadius = 3;
        if (node.x !== undefined && node.y !== undefined && node.width !== undefined && node.height !== undefined) {
            if (node.name === 'Root') {
                const portX = node.x + node.width/2;
                const portY = node.y;
                return Math.sqrt(Math.pow(x - portX, 2) + Math.pow(y - portY, 2)) <= portRadius;
            } else {
                const nextsCount = commandNodes.find(n => n.name === node.name)?.nextsCount || 0;
                if (portIndex >= nextsCount) return false;

                const portSpacing = node.height / (nextsCount + 1);
                const portX = node.x + node.width/2;
                const portY = node.y - node.height/2 + portSpacing * (portIndex + 1);
                return Math.sqrt(Math.pow(x - portX, 2) + Math.pow(y - portY, 2)) <= portRadius;
            }
        }
        return false;
    }, [commandNodes]);

    const handleNodeClick = useCallback((node: GraphNode, event: any) => {
        const { x: mouseX, y: mouseY } = event;
        const nextsCount = commandNodes.find(n => n.name === node.name)?.nextsCount || 0;

        for (let i = 0; i < nextsCount; i++) {
            if (isOverPort(node, mouseX, mouseY, i)) {
                console.log('Clicked port:', i);
                return;
            }
        }
    }, [commandNodes, isOverPort]);

    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const fontSize = 12/globalScale;
        ctx.font = `${fontSize}px Arial`;

        const lines = [
            node.name,
            ...node.paramsName.map((name: string, index: number) =>
                `${name}: ${node.params[index] || ''}`)
        ];

        const padding = fontSize;
        const lineHeight = fontSize * 1.2;
        const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const boxWidth = textWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;

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
        lines.forEach((line, index) => {
            const y = node.y - boxHeight/2 + padding + lineHeight * (index + 0.5);
            ctx.fillText(line, node.x - textWidth/2, y);
        });

        if (node.name === 'Root') {
            const portX = node.x + boxWidth/2;
            const portY = node.y;
            ctx.beginPath();
            ctx.arc(portX, portY, 3, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            const nextsCount = commandNodes.find(n => n.name === node.name)?.nextsCount || 0;
            if (nextsCount > 0) {
                const portSpacing = boxHeight / (nextsCount + 1);
                for (let i = 0; i < nextsCount; i++) {
                    const portX = node.x + boxWidth/2;
                    const portY = node.y - boxHeight/2 + portSpacing * (i + 1);
                    ctx.beginPath();
                    ctx.arc(portX, portY, 3, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    }, [commandNodes]);

    return (
        <>
            <ForceGraph2D
                width={window.innerWidth * 0.4}
                height={window.innerHeight * 0.6}
                graphData={graphData}
                nodeLabel="name"
                nodeCanvasObject={nodeCanvasObject}
                nodeCanvasObjectMode={() => 'replace'}
                onNodeClick={handleNodeClick}
                onNodeDrag={(node, translate) => {
                    if (draggingPort) {
                        console.log('Dragging port:', draggingPort);
                    }
                }}
                onNodeDragEnd={() => {
                    setDraggingPort(null);
                }}
                onBackgroundRightClick={handleContextMenu}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                cooldownTicks={100}
                d3VelocityDecay={0.3}
                nodeRelSize={2}
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