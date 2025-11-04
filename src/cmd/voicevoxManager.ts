import { spawn } from 'child_process';
import path from 'path';

const enginePath = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'VOICEVOX', 'vv-engine', 'run.exe');

const voicevoxProcess = spawn(enginePath, ['--host', '127.0.0.1', '--port', '50021']);

voicevoxProcess.stdout.on('data', (data) => {
  console.log(`VOICEVOX stdout: ${data}`);
});

voicevoxProcess.stderr.on('data', (data) => {
  console.error(`VOICEVOX stderr: ${data}`);
});

voicevoxProcess.on('close', (code) => {
  console.log(`VOICEVOX process exited with code ${code}`);
});

