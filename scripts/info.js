#!/usr/bin/env node

/**
 * Script de Exibição de Resumo de Acesso e Comandos do Sistema
 */

const reset = '\x1b[0m';
const bright = '\x1b[1m';
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const magenta = '\x1b[35m';
const blue = '\x1b[34m';

console.log(`
${cyan}${bright}================================================================================${reset}`);
console.log(`${bright} Saask Store Multi-Tenant — Resumo de Operação & Acesso${reset}`);
console.log(`${cyan}${bright}================================================================================${reset}

${bright}URLs DE ACESSO DO SISTEMA:${reset}
   • ${green}${bright}Frontend (Aplicação Web UI):${reset}     http://localhost:3000
   • ${blue}${bright}Backend API (Express REST):${reset}       http://localhost:5000/api
   • ${yellow}${bright}MongoDB Database (Porta Nativa):${reset} mongodb://localhost:27017/Saask_store_ai

${bright}COMANDO DE POPULAÇÃO DO BANCO (SEED MULTI-TENANT):${reset}
   • ${magenta}${bright}Executar Seed no Docker:${reset}          npm run seed
   • ${magenta}${bright}Alternativa direta (Docker exec):${reset} docker exec saas_ai_backend node dist/utils/seed.js

${bright}CREDENCIAIS DE TESTE DISPONÍVEIS:${reset}
   1. ${bright}Superadmin Global:${reset}          email: ${green}superadmin@admin.com${reset}  | senha: ${yellow}password123${reset}
   2. ${bright}Admin AutoMotors (Veículos):${reset} email: ${green}admin@automotors.com${reset}   | senha: ${yellow}password123${reset}
   3. ${bright}User AutoMotors (Veículos):${reset}  email: ${green}user@automotors.com${reset}    | senha: ${yellow}password123${reset}
   4. ${bright}Admin HospiTech (Hospitalar):${reset}email: ${green}admin@hospitech.com${reset}   | senha: ${yellow}password123${reset}
   5. ${bright}User HospiTech (Hospitalar):${reset} email: ${green}user@hospitech.com${reset}    | senha: ${yellow}password123${reset}

${bright}⚡ ATALHOS ÚTEIS NO RAIZ (SEM ENTRAR EM PASTAS):${reset}
   • ${cyan}npm run up${reset}         -> Sobe o ambiente Docker com build e mostra este resumo
   • ${cyan}npm run seed${reset}       -> Popula o banco MongoDB com 2 empresas e 20+ produtos
   • ${cyan}npm run build${reset}      -> Compila o TypeScript do Backend e o Vite do Frontend
   • ${cyan}npm run start${reset}      -> Inicia o servidor do Backend e Frontend em modo produção
   • ${cyan}npm run dev${reset}        -> Inicia o modo desenvolvimento (Hot-reload)
   • ${cyan}npm run test${reset}      -> Executa a suíte de testes unitários e de integração (Vitest)
   • ${cyan}npm run info${reset}       -> Exibe este painel de informações a qualquer momento

${cyan}${bright}================================================================================${reset}
`);
