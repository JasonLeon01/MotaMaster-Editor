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
        if (graphRef.current) {
            const linkForce = graphRef.current.d3Force('link');
            if (linkForce) {
                linkForce.distance(35);
            }

            const chargeForce = graphRef.current.d3Force('charge');
            if (chargeForce) {
                chargeForce.strength((node: any) => {
                    const beingEnd = links.some(link => link.target === node.id);
                    return beingEnd ? -250 : -5;
                });
            }

            graphRef.current.d3Force('center', null);
            graphRef.current.d3ReheatSimulation();
        }
    }, [graphRef.current, links]);

    useEffect(() => {
        setNodes([{
            id: '0',
            name: 'Root',
            paramsName: ['=>'],
            params: ['']
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
        const handleMouseMove = (ev: MouseEvent) => {
            const canvas = document.querySelector('canvas');
            if (!canvas || !graphRef.current || !containerRect) return;

            const mouseX = ev.clientX - containerRect.left;
            const mouseY = ev.clientY - containerRect.top;

            setMousePos({ x: mouseX, y: mouseY });
            console.log(localEvent);
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
            const sss = ['fff\nfffffff', 'ggggggggg\ngg\ngggggg\nahlaf'];
            return {
                id: index.toString(),
                name: order.id === 'Root' ? 'Root' : (commandNode?.name || ''),
                paramsName: commandNode?.params || [],
                params: [...Array(order.params.length)].map(() => sss[index % sss.length]),
            };
        });

        const newLinks: GraphLink[] = [];
        if (localEvent.adjacency) {
            localEvent.adjacency.forEach(adj => {
                const { from, to } = adj;
                to.forEach(targetId => {
                    if (targetId!== null) {
                        newLinks.push({
                            source: from.toString(),
                            target: (targetId ?? -1).toString()
                        });
                    }
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
                if (node.name === 'Root') {
                    console.log('Not allowed to connect to Root');
                    setLinkStart(null);
                    setLinkStartPosition(null);
                    setStartIndex(null);
                    return;
                }
                const existingConnection = localEvent?.adjacency.some(adj => {
                    return adj.to.includes(parseInt(node.id));
                })
                if (existingConnection) {
                    console.log('Target node already connected');
                    setLinkStart(null);
                    setLinkStartPosition(null);
                    setStartIndex(null);
                    return;
                }
                const index = localEvent?.adjacency.findIndex(adj => adj.from === parseInt(linkStart.id));
                if (index !== -1) {
                    if (localEvent && localEvent.adjacency[index].to) {
                        localEvent.adjacency[index].to[startIndex!] = parseInt(node.id);
                    }
                }
                else {
                    const commandNode = commandNodes.find(node => node.name === linkStart.name);
                    localEvent?.adjacency.push({
                        from: parseInt(linkStart.id),
                        to: Array(commandNode?.nexts.length)
                            .fill(null)
                            .map((_, i) => i === startIndex ? parseInt(node.id) : null)
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
        let paramLines: string[] = [];
        paramLines.push(node.name);

        node.paramsName.forEach((name: string, index: number) => {
            const param = node.params[index] || '';
            const paramSplit = param.split('\n');
            const nameStr = `${name}: `;
            paramSplit.forEach((part: string, i: number) => {
                if (i === 0) {
                    paramLines.push(nameStr + part);
                } else {
                    paramLines.push(part);
                }
            });
        });

        const padding = fontSize;
        const lineHeight = fontSize * 1.2;
        const paramsWidth = Math.max(...paramLines.map((line: string) => ctx.measureText(line).width));

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

        const commandNode = commandNodes.find(n => n.name === node.name);
        const nexts = commandNode?.nexts || [];

        const { boxWidth, boxHeight, padding, lineHeight } = nodeRect(node, ctx, fontSize, nexts);
        let xStart = node.x - boxWidth/2 + padding;

        let paramLines: { name: string, part: string, nameX: number, partX: number }[] = [];
        paramLines.push({ name: node.name, part: '', nameX: xStart, partX: xStart + ctx.measureText(node.name).width });

        node.paramsName.forEach((name: string, index: number) => {
            const param = node.params[index] || '';
            const paramSplit = param.split('\n');
            const nameStr = `${name}: `;
            const nameWidth = ctx.measureText(nameStr).width;
            const partX = xStart + nameWidth;
            paramSplit.forEach((part: string, i: number) => {
                if (i === 0) {
                    paramLines.push({ name: nameStr, part, nameX: xStart, partX });
                } else {
                    paramLines.push({ name: '', part, nameX: xStart, partX });
                }
            });
        });

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
            ctx.fillStyle = '#555';
            ctx.fillText(line.name, line.nameX, y);
            ctx.fillStyle = '#000';
            ctx.fillText(line.part, line.partX, y);
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
        const sourceNode = link.source;
        const targetNode = link.target;

        if (!sourceNode || !targetNode || !graphRef.current) {
            return;
        }

        if (typeof sourceNode === 'number' || typeof targetNode === 'number' || typeof sourceNode === 'string' || typeof targetNode === 'string') {
            return;
        }

        const sourceLinks = localEvent.adjacency.find(l => l.from.toString() === link.source.id);
        if (!sourceLinks) {
            return;
        }
        const linkIndex = sourceLinks.to.findIndex(l => l?.toString() === link.target.id);

        const commandNode = commandNodes.find(n => n.name === sourceNode.name);
        const nexts = commandNode?.nexts || [];

        const fontSize = 12/globalScale;
        ctx.font = `${fontSize}px Arial`;
        const { boxWidth, boxHeight, padding, lineHeight } = nodeRect(sourceNode, ctx, fontSize, nexts);

        let startX, startY;
        const circleRadius = padding / 2;

        if (sourceNode.x === undefined || sourceNode.y === undefined || targetNode.x === undefined || targetNode.y === undefined) {
            return;
        }

        if (sourceNode.name === 'Root') {
            startY = sourceNode.y - boxHeight/2 + padding + lineHeight * 0.5;
            startX = sourceNode.x + boxWidth/2 - circleRadius;
        } else {
            console.log('linkIndex', linkIndex);
            const nextIndex = Math.min(linkIndex, nexts.length - 1);
            if (nextIndex >= 0 && nexts.length > 0) {
                startY = sourceNode.y - boxHeight/2 + padding + lineHeight * (nextIndex + 0.5);
                startX = sourceNode.x + boxWidth/2 - circleRadius;
            } else {
                startX = sourceNode.x;
                startY = sourceNode.y;
            }
        }

        const endX = targetNode.x;
        const endY = targetNode.y;

        ctx.strokeStyle = 'rgba(192, 192, 192, 0.9)';
        ctx.lineWidth = 2.5 / globalScale;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        const arrowLength = 8 / globalScale;
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);

        ctx.fillStyle = 'rgba(43, 124, 233, 0.9)';
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI/6),
            endY - arrowLength * Math.sin(angle - Math.PI/6)
        );
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI/6),
            endY - arrowLength * Math.sin(angle + Math.PI/6)
        );
        ctx.closePath();
        ctx.fill();
    }, [nodes, links, commandNodes, graphRef, graphRef.current]);

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
                linkDirectionalArrowLength={0}
                linkDirectionalArrowRelPos={1}
                linkDirectionalParticles={0}
                linkDirectionalParticleSpeed={0.005}
                linkCanvasObject={linkCanvasObject}
                linkCanvasObjectMode={() => 'replace'}
                cooldownTicks={100}
                d3VelocityDecay={0.3}
                dagMode="lr"
                dagLevelDistance={100}
                d3AlphaDecay={0.02}
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