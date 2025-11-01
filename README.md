# precession-cli

## npm script

- "build": typescript のビルド。dist フォルダに出力する
- "clean": dist フォルダの削除
- "start": 初期化実行。build -> clean -> main.ts の実行
- "create:question": questionList.json を task 化する
- "print:task": task 内容をコンソールに表示
- "execute:task": task の即時実行
- "recovery":task のリカバリ
- "help": コマンドの使い方を表示※ドキュメント作成用

### command help

```
Usage: recovery [options]
Options:
  -h, --hour <hour>      Recovery Target Time(h)
  -m, --minute <min>     Recovery Target Time(m)
  -w, --wait <waitTime>  Recovery Wait Time(ms) (default: "60000")
  --help                 display help for command

Usage: quickExecTask [options]
Options:
  -t, --task <task>  task name
  -h, --help         display help for command
```

# やることメモ

- remark/unified 使った markdown 解析
