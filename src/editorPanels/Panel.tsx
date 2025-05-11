import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Event_, Order } from '../GameData';
import { PythonParser } from '../utils/NodeParser';
import path from 'path';
import fs from 'fs';

interface ForceGraphProps {
    root: string;
    event: Event_ | null;
    onChange?: (ev: Event_) => void;
}

interface CommandNode {
    filename: string;
    name: string;
    params: string[];
    nexts: string[];
}

const Panel: React.FC<ForceGraphProps> = ({ root, event, onChange }) => {
    const [commandNodes, setCommandNodes] = useState<CommandNode[]>([]);
    const [localEvent, setLocalEvent] = useState<Event_>();

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

                console.log(nodes);
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
        if (event) {
            const newEvent = { ...event, id: '' };
            setLocalEvent(newEvent);
        }
        else {
            setLocalEvent(createNewEvent());
        }
    }, []);

    const updateEvent = (newEvent: Event_) => {
        setLocalEvent(newEvent);
        onChange?.(newEvent);
    }

    const createNewEvent = (): Event_ => {
        return {
            id: '',
            name: '',
            appear: '',
            orders: [],
            adjacency: []
        };
    }

    return (
        <>
        </>
    );
};

export default Panel;