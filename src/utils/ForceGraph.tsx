import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { Event } from '../GameData';
import { Box } from '@mui/material';
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
    paramCount: number;
    returnCount: number;
}

const ForceGraph: React.FC<ForceGraphProps> = ({ root, event }) => {
    const [commandNodes, setCommandNodes] = useState<CommandNode[]>([]);
    const [selectionOpen, setSelectionOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);

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
                        paramCount: result.paramCount ?? 0,
                        returnCount: result.returnCount ?? 0
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
            return {
                nodes: [{
                    id: '0',
                    name: 'Root',
                    content: ''
                }],
                links: []
            };
        }

        const nodes: GraphNode[] = event.orders.map((order, index) => ({
            id: index.toString(),
            name: `order ${index + 1}`,
            content: order.content
        }));

        const links: GraphLink[] = [];
        if (event.adjacency) {
            const { from, to } = event.adjacency;
            to.forEach(targetId => {
                links.push({
                    source: from.toString(),
                    target: targetId.toString()
                });
            });
        }

        return { nodes, links };
    }, [event]);

    const handleNodeClick = useCallback((node: GraphNode) => {
        console.log('Clicked node:', node);
    }, []);

    const handleContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        setSelectionOpen(true);
    }, []);

    const handleNodeSelect = useCallback((filename: string) => {
        const newNode: GraphNode = {
            id: (graphData.nodes.length).toString(),
            name: filename,
            content: filename
        };

        graphData.nodes.push(newNode);
    }, [graphData]);

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
        <Box
            sx={{ width: '100%', height: '600px', border: '1px solid #ccc' }}
            onContextMenu={handleContextMenu}
        >
            <ForceGraph2D
                graphData={graphData}
                nodeLabel="name"
                nodeCanvasObject={nodeCanvasObject}
                nodeCanvasObjectMode={() => 'replace'}
                onNodeClick={handleNodeClick}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                cooldownTicks={100}
                d3VelocityDecay={0.1}
            />
            <SelectionList
                open={selectionOpen}
                items={commandNodes.map(node => node.filename)}
                onClose={() => setSelectionOpen(false)}
                onSelect={handleNodeSelect}
            />
        </Box>
    );
};

export default ForceGraph;