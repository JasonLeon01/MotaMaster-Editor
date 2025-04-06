const fs = window.require('fs');

export interface ParserResult {
    paramCount: number | null;
    returnCount: number | null;
}

export const PythonParser = async (filePath: string): Promise<ParserResult> => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        const funcLine = lines.find((line: string) => line.trim().startsWith('def execute'));
        if (!funcLine) {
            return { paramCount: null, returnCount: null };
        }

        const paramMatch = funcLine.match(/\((.*?)\)/);
        const paramCount = paramMatch ? paramMatch[1].split(',').filter((p: string) => p.trim()).length : 0;

        const returnTypeMatch = funcLine.match(/-> *Tuple\[(.*?)\]/);
        const returnCount = returnTypeMatch
            ? returnTypeMatch[1].split(',').length
            : null;

        return { paramCount, returnCount };
    } catch (error) {
        console.error('Error parsing Python file:', error);
        return { paramCount: null, returnCount: null };
    }
};