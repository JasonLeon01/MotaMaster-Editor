
import ast

def parse_python_script(source_code):
    tree = ast.parse(source_code)
    execute_function = None
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == 'execute':
            execute_function = node
            break
    if execute_function is None:
        raise ValueError("Function execute not found.")
    param_count = len(execute_function.args.args)
    return_type = None
    for sub_node in ast.walk(execute_function):
        if isinstance(sub_node, ast.Return):
            if isinstance(sub_node.value, ast.Tuple):
                return_count = len(sub_node.value.elts)
            else:
                return_count = 1
            break
    else:
        raise ValueError("No return statement found.")
    return param_count, return_count

def parse_python_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            source_code = file.read()
        return parse_python_script(source_code)
    except FileNotFoundError:
        raise FileNotFoundError(f"File not found: {file_path}")
    except Exception as e:
        raise Exception(f"Error when parsing: {str(e)}")
