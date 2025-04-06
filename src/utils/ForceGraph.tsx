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
    content: string;
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

    useEffect(() => {
        setNodes([{
            id: '0',
            name: 'Root',
            content: ''
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
        if (!event) {
            return { nodes, links };
        }

        const newNodes: GraphNode[] = event.orders.map((order, index) => ({
            id: index.toString(),
            name: `order ${index + 1}`,
            content: order.content
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
    }, [event, nodes, links]);

    const handleNodeClick = useCallback((node: GraphNode) => {
        console.log('Clicked node:', node);
    }, []);

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
            content: selectedNode.filename
        };

        setNodes(prevNodes => [...prevNodes, newNode]);
    }, [nodes.length, commandNodes]);

    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.name;
        const fontSize = 12/globalScale;
        ctx.font = `${fontSize}px Arial`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth + 8, fontSize + 4].map(n => n + fontSize/2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(
            node.x - bckgDimensions[0]/2,
            node.y - bckgDimensions[1]/2,
            bckgDimensions[0],
            bckgDimensions[1]
        );

        ctx.strokeStyle = '#2B7CE9';
        ctx.strokeRect(
            node.x - bckgDimensions[0]/2,
            node.y - bckgDimensions[1]/2,
            bckgDimensions[0],
            bckgDimensions[1]
        );

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.fillText(label, node.x, node.y);
    }, []);

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