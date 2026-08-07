#!/usr/bin/env node

const reset = '\x1b[0m';
const green = '\x1b[32m';
const bright = '\x1b[1m';
const cyan = '\x1b[36m';

console.log(`
${green}${bright} Build concluído com sucesso!${reset}

Para acessar o site para o login, clique aqui: 
-> ${cyan}${bright}http://localhost:3000${reset}

(Nota: lembre-se de iniciar o servidor executando ${green}npm run start${reset} ou ${green}npm run up${reset})
`);
