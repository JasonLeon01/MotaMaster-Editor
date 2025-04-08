import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { Event } from '../GameData';
import SelectionList from './SelectionList';
import { PythonParser } from './NodeParser';
import path from 'path';
import fs from 'fs';

interface ForceGraphProps {
    root: string;
    event: Event | null;
    containerRect?: DOMRect | null;
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

const ForceGraph: React.FC<ForceGraphProps> = ({ root, event, containerRect }) => {
    const graphRef = useRef<ForceGraphMethods>();
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
    const [commandNodes, setCommandNodes] = useState<CommandNode[]>([]);
    const [selectionOpen, setSelectionOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [links, setLinks] = useState<GraphLink[]>([]);

    const [atIndex, setAtIndex] = useState<number | null>(null);

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

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const canvas = document.querySelector('canvas');
            if (!canvas || !graphRef.current || !containerRect) return;

            const mouseX = event.clientX - containerRect.left;
            const mouseY = event.clientY - containerRect.top;

            setMousePos({ x: mouseX, y: mouseY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [containerRect]);

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
        return false;
    }, [commandNodes]);

    const handleNodeMouseDown = useCallback((node: any, event: any) => {
        return;
    }, [commandNodes, connectingPort]);

    const handleBackgroundClick = useCallback((event: any) => {
        return;
    }, [connectingPort]);

    const inRange = (centre: { x: number, y: number}, radius: number) => {
        if (!mousePos) {
            console.log(mousePos);
            return false;
        }
        return (Math.pow(centre.x - mousePos.x, 2) + Math.pow(centre.y - mousePos.y, 2)) <= Math.pow(radius, 2);
    }

    const nodeRect = (node: any, ctx: CanvasRenderingContext2D, fontSize: number, nexts: string[]) => {
        const paramLines = [
            node.name,
            ...node.paramsName.map((name: string, index: number) =>
                `${name}: ${node.params[index] || ''}`)
        ];

        const padding = fontSize;
        const lineHeight = fontSize * 1.2;
        const paramsWidth = Math.max(...paramLines.map(line => ctx.measureText(line).width));

        const has_next = node.name === 'Root' ? true : (nexts.length > 0);

        const nextsWidth = node.name === 'Root'
            ? ctx.measureText('=>').width + padding * 2
            : (has_next
            ? Math.max(...nexts.map(next => ctx.measureText(next).width)) + padding * 2
            : 0);

        const textWidth = paramsWidth;
        const baseHeight = paramLines.length * lineHeight + padding * 2;

        const boxWidth = textWidth + padding * 2 + (has_next ? nextsWidth : 0);
        const boxHeight = Math.max(
            baseHeight,
            has_next ? (nexts.length + 1) * (baseHeight / (nexts.length + 1)) : 0
        );

        return { boxWidth, boxHeight, padding, lineHeight };
    };

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

        const { boxWidth, boxHeight, padding, lineHeight } = nodeRect(node, ctx, fontSize, nexts);

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

        setAtIndex(null);
        const circleRadius = padding / 2;
        if (node.name === 'Root') {
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'black';
            const textY = node.y - boxHeight/2 + padding + lineHeight * 0.5;
            const textX = node.x + boxWidth/2 - padding;
            ctx.fillText('=>', textX, textY);
            ctx.fillStyle = '#D3D3D3';

            let circleX = node.x + boxWidth/2;
            const circleY = textY;
            let { x, y } = graphRef.current?.graph2ScreenCoords(circleX, circleY) || { x: 0, y: 0 };
            const rightEdge = x;
            circleX -= circleRadius;
            x = (graphRef.current?.graph2ScreenCoords(circleX, circleY) || { x: 0, y: 0 }).x;
            const radius = rightEdge - x;
            if (x && y) {
                if (inRange({ x, y }, radius)) {
                    ctx.fillStyle = '#90EE90';
                    setAtIndex(0);
                }
            }
            ctx.beginPath();
            ctx.arc(circleX, circleY, padding / 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        else {
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            if (nexts.length > 0) {
                nexts.forEach((next, index) => {
                    ctx.fillStyle = 'black';
                    const textY = node.y - boxHeight/2 + padding + lineHeight * (index + 0.5);
                    const textX = node.x + boxWidth/2 - padding;
                    ctx.fillText(next, textX, textY);

                    ctx.fillStyle = '#D3D3D3';
                    let circleX = node.x + boxWidth/2;
                    const circleY = textY;
                    let { x, y } = graphRef.current?.graph2ScreenCoords(circleX, circleY) || { x: 0, y: 0 };
                    const rightEdge = x;
                    circleX -= circleRadius;
                    x = (graphRef.current?.graph2ScreenCoords(circleX, circleY) || { x: 0, y: 0 }).x;
                    const radius = rightEdge - x;
                    if (x && y) {
                        if (inRange({ x, y }, radius)) {
                            ctx.fillStyle = '#90EE90';
                            setAtIndex(index);
                        }
                    }
                    ctx.beginPath();
                    ctx.arc(circleX, circleY, padding / 2, 0, 2 * Math.PI);
                    ctx.fill();
                })
            }
        }
    }, [commandNodes, draggingPort, mousePos]);

    const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const fontSize = 12/globalScale;
        ctx.font = `${fontSize}px Arial`;

        const commandNode = commandNodes.find(n => n.name === node.name);
        const nexts = commandNode?.nexts || [];

        const { boxWidth, boxHeight } = nodeRect(node, ctx, fontSize, nexts);

        ctx.fillStyle = color;
        ctx.fillRect(
            node.x - boxWidth/2,
            node.y - boxHeight/2,
            boxWidth,
            boxHeight
        )
    }, [commandNodes]);

    return (
        <>
            <ForceGraph2D
                ref={graphRef}
                width={window.innerWidth * 0.4}
                height={window.innerHeight * 0.6}
                graphData={graphData}
                enableZoomInteraction={false}
                nodeLabel="name"
                nodeCanvasObject={nodeCanvasObject}
                nodePointerAreaPaint={nodePointerAreaPaint}
                nodeCanvasObjectMode={() => 'replace'}
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