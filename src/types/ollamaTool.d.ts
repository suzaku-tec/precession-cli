interface ToolCallParams {
}

interface ToolCallExecutor<P extends ToolCallParams> {
  convertArgs(args: { [key: string]: any }): P;
  execute(params: P): Promise<string>;
}

