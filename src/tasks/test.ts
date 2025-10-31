
interface TestTaskParam extends TaskParam {
  test: string;
}

export default class Test implements TaskExecutor {
  execute(taskInfo: TaskInfo, taskParam: TestTaskParam
  ): void {
    console.log(`Executing test task: ${taskInfo.name}: param=${taskParam.test}`);
  }
}
