const fs = window.require('fs');

export interface ParserResult {
    name: string;
    params: string[];
    nexts: string[];
}

export const PythonParser = async (filePath: string): Promise<ParserResult> => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        const executeIndex = lines.findIndex((line: string) => line.trim().startsWith('def execute'));
        if (executeIndex < 2) {
            throw new Error('Comment not found before def execute');
        }

        const comment1 = lines[executeIndex - 2].trim();
        const comment2 = lines[executeIndex - 1].trim();
        const comment3 = lines[executeIndex - 3].trim();

        let name: string | null = null;
        let params: string[] = [];
        let nexts: string[] = [];

        [comment1, comment2, comment3].forEach(comment => {
            const cleanComment = comment.replace(/^#\s*/, '').trim();

            if (cleanComment.startsWith('name:')) {
                name = cleanComment.replace('name:', '').trim();
            }
            else if (cleanComment.startsWith('params:')) {
                const paramsMatch = cleanComment.match(/params:\s*\[(.*?)\]/);
                if (paramsMatch) {
                    params = paramsMatch[1].split(',').map((p: string) => p.trim()).filter(Boolean);
                }
            }
            else if (cleanComment.startsWith('nexts:')) {
                const nextsMatch = cleanComment.match(/nexts:\s*\[(.*?)\]/);
                if (nextsMatch) {
                    nexts = nextsMatch[1].split(',').map((n: string) => n.trim()).filter(Boolean);
                }
            }
        });

        if (!name || params.length === 0 || nexts.length === 0) {
            throw new Error('Invalid comment format');
        }

        return { name, params, nexts };
    } catch (error) {
        console.error('Error parsing Python file:', error);
        throw error;
    }
};