const http = require('http');
const readline = require('readline');

let currentState = 'norm';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `[${currentState}]->`
});

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<h1>Состояние: ${currentState}</h1>`);
});

server.listen(5000, () => {
  console.log('Сервер запущен на http://localhost:5000');
  rl.prompt();
});

rl.on('line', (input) => {
  input = input.trim().toLowerCase();
  
  const validStates = ['norm', 'stop', 'test', 'idle', 'exit'];
  
  if (validStates.includes(input)) {
    if (input === 'exit') {
      console.log('Завершение работы...');
      process.exit(0);
    }
    
    console.log(`reg = ${currentState}--> ${input}`);
    currentState = input;
  } else {
    console.log(`Неизвестная команда: ${input}`);
  }
  
  rl.setPrompt(`[${currentState}]->`);
  rl.prompt();
}).on('close', () => {
  console.log('Завершение работы...');
  process.exit(0);
});