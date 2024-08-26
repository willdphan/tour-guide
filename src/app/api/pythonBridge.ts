import { PythonShell } from 'python-shell';
import path from 'path';

export async function runAgent(question: string): Promise<AsyncIterableIterator<any>> {
  console.log('runAgent called with question:', question);
  return {
    async *[Symbol.asyncIterator]() {
      const scriptPath = path.join(process.cwd(), 'src', 'app', 'api', 'web_tour_guide.py');
      console.log('Python script path:', scriptPath);
      
      const pyshell = new PythonShell(scriptPath, { mode: 'json' });
      
      console.log('Sending question to Python script');
      pyshell.send(JSON.stringify({ question }));

      console.log('Waiting for messages from Python script');
      for await (const message of pyshell.on('message')) {
        console.log('Received message from Python:', message);
        yield JSON.parse(message);
      }

      console.log('Python script execution completed');
    }
  };
}