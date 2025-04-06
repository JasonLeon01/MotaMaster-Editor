const fs = window.require('fs');

export interface ParserResult {
    name: string;
    params: string[];
    nextsCount: number;
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
        let nextsCount = 0;

        // 解析注释，去掉开头的 #
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
            else if (cleanComment.startsWith('nextsCount:')) {
                const countMatch = cleanComment.match(/nextsCount:\s*(\d+)/);
                if (countMatch) {
                    nextsCount = parseInt(countMatch[1]);
                }
            }
        });

        if (!name || params.length === 0 || nextsCount === 0) {
            throw new Error('Invalid comment format');
        }

        return { name, params, nextsCount };
    } catch (error) {
        console.error('Error parsing Python file:', error);
        throw error;
    }
};