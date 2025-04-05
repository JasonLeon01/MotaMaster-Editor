import { loadPyodide, type PyodideInterface } from 'pyodide';

export interface ParserResult {
    paramCount: number | null;
    returnCount: number | null;
}

export const PythonParser = (filePath: string) => {
    const parsePythonScript = async () => {
        let pyodide: PyodideInterface;
        try {
            pyodide = await loadPyodide();
            const response = await fetch('./NodeParser.py');
            const nodeParserContent = await response.text();
            const pythonCode = `
${nodeParserContent}

param_count, return_count = parse_python_file("${filePath.replace(/\\/g, '/')}")
[param_count, return_count]
`;
            const [paramCount, returnCount] = await pyodide.runPythonAsync(pythonCode);
            return { paramCount, returnCount };
        } catch (error) {
            console.error('Error when parsing Python script:', error);
            return { paramCount: null, returnCount: null };
        }
    };

    return parsePythonScript();
}
