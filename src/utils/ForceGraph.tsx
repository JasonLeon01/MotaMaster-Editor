import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { Event_ } from '../GameData';
import SelectionList from './SelectionList';
import { PythonParser } from './NodeParser';
import path from 'path';
import fs from 'fs';

interface ForceGraphProps {
    root: string;
    event: Event_ | null;
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
    const [localEvent, setLocalEvent] = useState<Event_>(() => {
        return event || {
            id: 0,
            name: '',
            appear: '',
            orders: [{
                id: 'Root',
                params: ['']
            }],
            adjacency: []
        };
    });
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
    const [commandNodes, setCommandNodes] = useState<CommandNode[]>([]);
    const [selectionOpen, setSelectionOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [links, setLinks] = useState<GraphLink[]>([]);

    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
    const [hoveredLinkPointOfNode, setHoveredLinkPointOfNode] = useState<GraphNode | null>(null);
    const [hoveredNodeLinkPointPosition, setHoveredNodeLinkPointPosition] = useState<{ x: number, y: number } | null>(null);
    const [startIndex, setStartIndex] = useState<number | null>(null);
    const [linkStart, setLinkStart] = useState<GraphNode | null>(null);
    const [linkStartPosition, setLinkStartPosition] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        setNodes([{
            id: '0',
            name: 'Root',
            paramsName: ['=>'],
            params: ['']
        }]);
    }, []);

    useEffect(() => {
        if (localEvent) {
            setLocalEvent(localEvent ||
                {
                    id: 0,
                    name: '',
                    appear: '',
                    orders: [{
                        id: 'Root',
                        params: ['']
                    }],
                    adjacency: []
                }
            );
        }
    }, [localEvent]);


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
        const handleMouseMove = (ev: MouseEvent) => {
            const canvas = document.querySelector('canvas');
            if (!canvas || !graphRef.current || !containerRect) return;

            const mouseX = ev.clientX - containerRect.left;
            const mouseY = ev.clientY - containerRect.top;

            setMousePos({ x: mouseX, y: mouseY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [containerRect]);

    const graphData = useMemo(() => {
        if (!commandNodes.length) {
            return { nodes, links };
        }

        const newNodes: GraphNode[] = localEvent.orders.map((order, index) => {
            const commandNode = commandNodes.find(node => node.filename === order.id);
            return {
                id: index.toString(),
                name: order.id === 'Root' ? 'Root' : (commandNode?.name || ''),
                paramsName: commandNode?.params || [],
                params: [...Array(order.params.length)].map(() => ''),
            };
        });

        const newLinks: GraphLink[] = [];
        if (localEvent.adjacency) {
            localEvent.adjacency.forEach(adj => {
                const { from, to } = adj;
                to.forEach(targetId => {
                    newLinks.push({
                        source: from.toString(),
                        target: targetId.toString()
                    });
                });
            });
        }

        setNodes(prevNodes => {
            if (JSON.stringify(prevNodes) !== JSON.stringify(newNodes)) {
                return newNodes;
            }
            return prevNodes;
        });

        setLinks(prevLinks => {
            if (JSON.stringify(prevLinks) !== JSON.stringify(newLinks)) {
                return newLinks;
            }
            return prevLinks;
        });

        return { nodes: newNodes, links: newLinks };
    }, [localEvent, nodes, links, commandNodes.length, commandNodes]);

    const handleContextMenu = useCallback((ev: MouseEvent) => {
        ev.preventDefault();
        setContextMenuPosition({ x: ev.clientX, y: ev.clientY });
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

        setNodes(prevNodes => [...prevNodes, newNode]);
        localEvent?.orders.push({
            id: selectedNode.filename,
            params: newNode.params
        });
    }, [nodes.length, commandNodes]);

    const handleNodeMouseDown = useCallback((node: any, ev: any) => {
        if (!linkStart) {
            if (hoveredLinkPointOfNode === node && hoveredNodeLinkPointPosition) {
                setLinkStart(node);
                setLinkStartPosition({ x: hoveredNodeLinkPointPosition.x, y: hoveredNodeLinkPointPosition.y });
                return;
            }
        }
        else {
            if (node && linkStart !== node) {
                const index = localEvent?.adjacency.findIndex(adj => adj.from === parseInt(linkStart.id));
                if (index !== -1) {
                    if (localEvent && localEvent.adjacency[index].to) {
                        localEvent.adjacency[index].to[startIndex!] = parseInt(node.id);
                    }
                }
                else {
                    localEvent?.adjacency.push({
                        from: parseInt(linkStart.id),
                        to: Array(node.params.length)
                            .fill(null)
                            .map((_, i) => i === startIndex ? parseInt(node.id) : null)
                            .filter((id): id is number => id !== null)
                        }
                    );
                }
                const newLinks: GraphLink[] = [];
                localEvent?.adjacency.forEach(adj => {
                    const { from, to } = adj;
                    to.forEach(targetId => {
                        if (targetId !== null) {
                            newLinks.push({
                                source: from.toString(),
                                target: targetId.toString()
                            });
                        }
                    });
                });
                setLinks(newLinks);
                console.log('newlinks', newLinks);
            }
        }
        setLinkStart(null);
        setLinkStartPosition(null);
        setStartIndex(null);
    }, [commandNodes, linkStart, hoveredLinkPointOfNode, hoveredNodeLinkPointPosition, startIndex, links, nodes]);

    const handleBackgroundClick = useCallback((ev: any) => {
        if (linkStart) {
            if (hoveredNode === null) {
                setLinkStart(null);
                setLinkStartPosition(null);
                setStartIndex(null);
            }
        }
    }, [commandNodes, linkStart, hoveredLinkPointOfNode, hoveredNodeLinkPointPosition, startIndex, hoveredNode, links, nodes]);

    const inRange = (centre: { x: number, y: number}, radius: number) => {
        if (!mousePos) {
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

        const circleRadius = padding / 2;
        let targetNode = null;
        let targetPos = null;
        let startIndex = null;
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
                    targetNode = node;
                    targetPos = { x: circleX, y: circleY };
                    startIndex = 0;
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
                            targetNode = node;
                            targetPos = { x: circleX, y: circleY };
                            startIndex = index;
                        }
                    }
                    ctx.beginPath();
                    ctx.arc(circleX, circleY, padding / 2, 0, 2 * Math.PI);
                    ctx.fill();
                })
            }
        }

        if (hoveredNode && targetNode && targetPos) {
            setHoveredLinkPointOfNode(targetNode);
            setHoveredNodeLinkPointPosition(targetPos);
            setStartIndex(startIndex);
        }

        if (linkStartPosition) {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(linkStartPosition.x, linkStartPosition.y);
            const graphCoords = graphRef.current?.screen2GraphCoords(
                mousePos!.x,
                mousePos!.y
            ) || { x: 0, y: 0 };
            ctx.lineTo(graphCoords.x, graphCoords.y);
            ctx.stroke();
        }
    }, [commandNodes, mousePos]);

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

    const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    }, []);

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
                onNodeHover={(node: any, previousNode: any) => {
                    setHoveredNode(node);
                  }}
                onNodeClick={handleNodeMouseDown}
                onBackgroundClick={handleBackgroundClick}
                onBackgroundRightClick={handleContextMenu}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                linkCanvasObject={linkCanvasObject}
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