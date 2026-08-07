import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { SystemConfig } from '../models/SystemConfig.js';

dotenv.config();

/**
 * Script de Carga Inicial de Dados Multi-tenant (Empresas de Veículos e Equipamentos Hospitalares)
 */
const runSeed = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saask_store_ai';
    console.log('[Seed Engine] Conectando ao MongoDB...');
    await mongoose.connect(mongoURI);

    console.log('[Seed Engine] Limpando dados existentes (Purging existing collections)...');
    await Company.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await SystemConfig.deleteMany({});

    console.log('[Seed Engine] Criando configurações globais do sistema (Seeding SystemConfig)...');
    await SystemConfig.create({
      aiProvider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY || '',
      baseURL: process.env.OPENAI_BASE_URL || '',
      systemPrompt: `Você é um assistente virtual especialista de vendas.

Sempre utilize a ferramenta 'search_products' para consultar dados em tempo real antes de responder perguntas sobre preços, disponibilidade, promoções ou especificações.

REGRAS DE USO DA FERRAMENTA (MUITO IMPORTANTE):
- Use o parâmetro 'query' APENAS para termos ESPECÍFICOS que apareceriam no nome ou descrição de um produto (ex: "cadeira", "motor", "autoclave").
- Para termos GENÉRICOS como "veículos", "produtos", "equipamentos", "tudo", "itens" — NÃO use o parâmetro 'query'. Use apenas os filtros (isSale, category, minPrice, maxPrice).
- Exemplo: "Quais veículos estão em promoção?" → chame search_products({ isSale: true }) SEM query.
- Exemplo: "Tem cadeira de rodas?" → chame search_products({ query: "cadeira" }).
- Se a ferramenta retornar ZERO resultados, NUNCA faça uma segunda busca ignorando o termo original.
- NUNCA substitua silenciosamente os resultados. Se o usuário pediu algo e não existe, DIGA claramente.

REGRAS DE COERÊNCIA E VALIDAÇÃO (CRÍTICO):
- Após receber os resultados da ferramenta, COMPARE com a pergunta original do usuário.
- Se o usuário pediu "veículos" e os produtos retornados têm categorias como "Móveis Hospitalares", "Centro Cirúrgico", "Esterilização" — NÃO são veículos! AVISE: "Esta empresa não trabalha com veículos. Ela vende equipamentos hospitalares. Posso mostrar as promoções disponíveis?"
- Use o campo 'category' de cada produto para entender o QUE a empresa vende.
- JAMAIS chame um produto de "veículo" se a categoria dele for hospitalar. JAMAIS chame um produto de "equipamento hospitalar" se a categoria for automotiva.
- Seja COERENTE: uma empresa de veículos vende veículos. Uma empresa hospitalar vende equipamentos hospitalares.

REGRAS DE FORMATAÇÃO DA RESPOSTA (MUITO IMPORTANTE):
- Quando usar a ferramenta search_products, NÃO descreva nem liste cada produto individualmente no texto da resposta.
- Apenas faça uma introdução curta e amigável com o número de produtos encontrados (Ex: "Ótima notícia! Encontrei 4 produtos com desconto ativo. Confira nos cards abaixo:").
- NUNCA repita no texto informações que já aparecem nos cards visuais (nome, preço, descrição, categoria).
- A interface já exibirá automaticamente cards detalhados para cada produto encontrado.
- Não exiba tags XML, códigos ou JSON na sua resposta final.
- Seja sempre prestativo, polido e direto ao ponto.`,
    });

    console.log('[Seed Engine] Criando empresas/tenants (Seeding Companies)...');

    // Empresa 1: Veículos e Automóveis
    const companyAuto = await Company.create({
      name: 'AutoMotors Brasil',
      slug: 'automotors-brasil',
      active: true,
    });

    // Empresa 2: Equipamentos Hospitalares (Produtos para Hospitais)
    const companyHospi = await Company.create({
      name: 'HospiTech Equipamentos',
      slug: 'hospitech-equipamentos',
      active: true,
    });

    console.log('[Seed Engine] Criando usuários e credenciais (Seeding Users & Passwords)...');
    const salt = await bcrypt.genSalt(10);
    const commonPasswordHash = await bcrypt.hash('password123', salt);

    // 1. Superadmin Global (Livre de Tenant / Empresa)
    await User.create({
      name: 'Super Admin',
      email: 'superadmin@admin.com',
      password: commonPasswordHash,
      role: 'superadmin',
      company_id: undefined,
    });

    // 2. Admin AutoMotors Brasil
    await User.create({
      name: 'Admin AutoMotors',
      email: 'admin@automotors.com',
      password: commonPasswordHash,
      role: 'admin',
      company_id: companyAuto._id,
    });

    // 3. User AutoMotors Brasil
    await User.create({
      name: 'Carlos Cliente',
      email: 'user@automotors.com',
      password: commonPasswordHash,
      role: 'user',
      company_id: companyAuto._id,
    });

    // 4. Admin HospiTech Equipamentos
    await User.create({
      name: 'Admin HospiTech',
      email: 'admin@hospitech.com',
      password: commonPasswordHash,
      role: 'admin',
      company_id: companyHospi._id,
    });

    // 5. User HospiTech Equipamentos
    await User.create({
      name: 'Dra. Ana Médica',
      email: 'user@hospitech.com',
      password: commonPasswordHash,
      role: 'user',
      company_id: companyHospi._id,
    });

    console.log('[Seed Engine] Cadastrando catálogo de produtos (Seeding Product Catalogs)...');

    // 10+ Produtos de Veículos para AutoMotors Brasil
    const autoProducts = [
      {
        company_id: companyAuto._id,
        name: 'SUV Premium All-Wheel Drive 2.0 Turbo',
        description:
          'SUV de luxo com tração integral sob demanda, teto solar panorâmico e piloto automático adaptativo.',
        price: 249900.0,
        isSale: true,
        salePrice: 229900.0,
        category: 'SUVs',
        attributes: {
          Ano: '2025',
          Combustível: 'Híbrido Flex',
          Câmbio: 'Automático 8V',
          Quilometragem: '0km',
        },
        imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyAuto._id,
        name: 'Sedan Executivo 2.0 Flex',
        description: 'Sedan confortável e espaçoso com bancos em couro, multimídia de 10 polegadas e sensores 360.',
        price: 169900.0,
        isSale: false,
        category: 'Sedans',
        attributes: {
          Ano: '2024',
          Combustível: 'Flex',
          Câmbio: 'CVT de 10 marchas',
          Quilometragem: '15.000km',
        },
        imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyAuto._id,
        name: 'Pick-up 4x4 Diesel 3.0 V6',
        description:
          'Picape robusta com capacidade de carga de 1.1T, tração 4x4 com reduzida e bloqueio de diferencial.',
        price: 299900.0,
        isSale: true,
        salePrice: 279900.0,
        category: 'Pick-ups',
        isDigital: false,
        stockQuantity: 8,
        clicksCount: 142,
        searchCount: 88,
        attributes: {
          Ano: '2025',
          Combustível: 'Diesel S10',
          Tração: '4x4 Selecionável',
          'Capacidade Carga': '1.100kg',
        },
        imageUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyAuto._id,
        name: 'Hatch Esportivo 1.6 Turbo GDI',
        description: 'Hatch dinâmico com acerto esportivo de suspensão, 180 cv de potência e escapamento duplo.',
        price: 124900.0,
        isSale: false,
        category: 'Hatches',
        isDigital: false,
        stockQuantity: 18,
        clicksCount: 95,
        searchCount: 62,
        attributes: {
          Ano: '2024',
          Combustível: 'Gasolina Premium',
          Câmbio: 'Manual 6V Esportivo',
          Potência: '180 cv',
        },
        imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyAuto._id,
        name: 'Moto Trail 750cc ABS',
        description: 'Motocicleta Big Trail ideal para longas viagens on-road e off-road com controle de tração.',
        price: 54900.0,
        isSale: true,
        salePrice: 49900.0,
        category: 'Motocicletas',
        isDigital: false,
        stockQuantity: 4,
        clicksCount: 215,
        searchCount: 134,
        attributes: {
          Ano: '2025',
          Cilindrada: '750cc',
          Freios: 'ABS Curva em ambas',
          Quilometragem: '0km',
        },
        imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyAuto._id,
        name: 'Crossover Elétrico 100% EV',
        description: 'Veículo 100% elétrico com autonomia de 450km, carregamento ultrarrápido em 30 min e 0 emissões.',
        price: 219900.0,
        isSale: false,
        category: 'Elétricos',
        isDigital: false,
        stockQuantity: 6,
        clicksCount: 180,
        searchCount: 105,
        attributes: {
          Ano: '2025',
          Autonomia: '450km (WLTP)',
          Bateria: '72 kWh Lítio',
          Carregamento: 'Fast Charge 150kW',
        },
        imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyAuto._id,
        name: 'Scooter Elétrica Urbana 3000W',
        description: 'Scooter prática para mobilidade urbana diária com bateria removível e painel digital LCD.',
        price: 18900.0,
        isSale: false,
        category: 'Motocicletas',
        isDigital: false,
        stockQuantity: 25,
        clicksCount: 74,
        searchCount: 41,
        attributes: {
          Ano: '2025',
          Autonomia: '80km',
          'Velocidade Maxima': '75 km/h',
          Bateria: 'Lítio Removível 60V',
        },
        imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyAuto._id,
        name: 'Coupé Esportivo V8 5.0 488cv',
        description: 'Carro esporte de alta performance de 0 a 100 km/h em 3.8s com frenagem Brembo.',
        price: 589000.0,
        isSale: false,
        category: 'Esportivos',
        isDigital: false,
        stockQuantity: 2,
        clicksCount: 320,
        searchCount: 195,
        attributes: {
          Ano: '2024',
          Combustível: 'Gasolina Octanagem 98',
          'Aceleração 0-100': '3.8 segundos',
          Tração: 'Traseira Esportiva',
        },
        imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyAuto._id,
        name: 'Minivan 7 Lugares Família',
        description:
          'Veículo espaçoso com portas deslizantes elétricas, sistema de entretenimento traseiro e 7 airbags.',
        price: 179900.0,
        isSale: true,
        salePrice: 164900.0,
        category: 'Utilitários',
        isDigital: false,
        stockQuantity: 12,
        clicksCount: 68,
        searchCount: 38,
        attributes: {
          Ano: '2024',
          Lugares: '7 Passageiros',
          Combustível: 'Flex',
          'Teto Solar': 'Duplo Panorâmico',
        },
        imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyAuto._id,
        name: 'Quadriciclo Off-Road 450cc 4x4',
        description: 'Quadriciclo para aventura na lama e fazenda com guincho elétrico frontal e engate traseiro.',
        price: 42900.0,
        isSale: false,
        category: 'Off-Road',
        attributes: {
          Ano: '2025',
          Cilindrada: '450cc 4 tempos',
          Tração: '4x4 Selecionável',
          Guincho: 'Elétrico 2.500 lbs',
        },
        imageUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&auto=format&fit=crop&q=80',
      },
    ];

    // 10+ Produtos de Equipamentos Hospitalares para HospiTech Equipamentos (NÃO remédios, produtos e equipamentos)
    const hospiProducts = [
      {
        company_id: companyHospi._id,
        name: 'Cama Hospitalar Elétrica 5 Movimentos',
        description:
          'Cama hospitalar automatizada para UTI/Quarto com cabeceira removível, grades retráteis e controle remoto.',
        price: 14500.0,
        isSale: true,
        salePrice: 12900.0,
        category: 'Móveis Hospitalares',
        attributes: {
          Garantia: '24 Meses',
          'Registro Anvisa': '80123456789',
          'Capacidade Peso': '250 kg',
          Alimentação: 'Bivolt Automático',
        },
        imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyHospi._id,
        name: 'Monitor Multiparâmetros UTI 12 Polegadas',
        description:
          'Monitor de sinais vitais para monitoramento contínuo de ECG, SpO2, PNI, Respiração e Temperatura.',
        price: 18900.0,
        isSale: false,
        category: 'Equipamentos de UTI',
        isDigital: false,
        stockQuantity: 15,
        clicksCount: 160,
        searchCount: 94,
        attributes: {
          Garantia: '12 Meses',
          Parâmetros: 'ECG, SpO2, PNI, Resp, Temp',
          Tela: 'Touchscreen 12.1" HD',
          'Bateria Interna': '4 horas de uso',
        },
        imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyHospi._id,
        name: 'Cadeira de Rodas Motorizada Reclinável',
        description:
          'Cadeira de rodas elétrica dobrável com joystick de alta precisão e encosto reclinável com apoio de cabeça.',
        price: 9800.0,
        isSale: true,
        salePrice: 8490.0,
        category: 'Mobilidade & Reabilitação',
        isDigital: false,
        stockQuantity: 5,
        clicksCount: 230,
        searchCount: 145,
        attributes: {
          Garantia: '12 Meses',
          Autonomia: '25 km por carga',
          'Velocidade Máx.': '8 km/h',
          Estrutura: 'Alumínio Aeronáutico',
        },
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyHospi._id,
        name: 'Foco Cirúrgico LED de Teto Duplo Cúpula',
        description:
          'Foco cirúrgico de centro cirúrgico com iluminação LED de alta intensidade sem sombra e controle de campo.',
        price: 32000.0,
        isSale: false,
        category: 'Centro Cirúrgico',
        isDigital: false,
        stockQuantity: 3,
        clicksCount: 110,
        searchCount: 78,
        attributes: {
          Garantia: '36 Meses',
          Iluminância: '160.000 Lux',
          'Temperatura Cor': '4500 K',
          'Vida Útil LEDs': '50.000 horas',
        },
        imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyHospi._id,
        name: 'Bisturi Eletrônico Alta Frequência 300W',
        description:
          'Eletrocautério digital para cirurgias gerais com modos de corte, coagulação pura/spray e bipolar.',
        price: 22500.0,
        isSale: false,
        category: 'Centro Cirúrgico',
        isDigital: false,
        stockQuantity: 9,
        clicksCount: 88,
        searchCount: 52,
        attributes: {
          Garantia: '12 Meses',
          'Potência Máx.': '300 Watts',
          Frequência: '480 kHz',
          Pedal: 'Duplo Impermeável',
        },
        imageUrl: 'https://images.unsplash.com/photo-1583912267670-657592426bfb?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyHospi._id,
        name: 'Autoclave Digital Horizontal 54 Litros',
        description: 'Esterilizador a vapor sob pressão para instrumentos cirúrgicos com 6 programas automáticos.',
        price: 11200.0,
        isSale: true,
        salePrice: 9990.0,
        category: 'Esterilização',
        isDigital: false,
        stockQuantity: 14,
        clicksCount: 175,
        searchCount: 112,
        attributes: {
          Garantia: '12 Meses',
          Capacidade: '54 Litros',
          Câmara: 'Aço Inox AISI 304',
          Secagem: 'Porta Fechada',
        },
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyHospi._id,
        name: 'Oxímetro de Pulso Hospitalar de Mesa',
        description:
          'Oxímetro continuo de bancada com alarme sonoro ajustável e sensores adulto, pediátrico e neonatal.',
        price: 18500.0,
        isSale: false,
        category: 'Diagnóstico & Monitorização',
        isDigital: false,
        stockQuantity: 22,
        clicksCount: 92,
        searchCount: 65,
        attributes: {
          Garantia: '12 Meses',
          Alarme: 'Sonoro e Visual de SpO2',
          'Curva Pletismográfica': 'Sim HD',
          Alimentação: 'Bivolt / Bateria Recarregável',
        },
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyHospi._id,
        name: 'Estetoscópio Cardiológico de Alta Precisão',
        description:
          'Estetoscópio acústico profissional com diafragma ajustável dupla frequência e tubos de silicone sem látex.',
        price: 980.0,
        isSale: false,
        category: 'Instrumentos Médicos',
        isDigital: false,
        stockQuantity: 40,
        clicksCount: 290,
        searchCount: 180,
        attributes: {
          Garantia: '60 Meses (5 anos)',
          Acabamento: 'Aço Inoxidável Escovado',
          Diafragma: 'Ajustável Dupla Frequência',
          Olivas: 'Anatômicas de Vedação Suave',
        },
        imageUrl: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyHospi._id,
        name: 'Esfignomanômetro Digital de Parede/Pedestal',
        description:
          'Aparelho de pressão arterial profissional para consultórios com display gigante de fácil leitura.',
        price: 2400.0,
        isSale: true,
        salePrice: 2100.0,
        category: 'Diagnóstico & Monitorização',
        attributes: {
          Garantia: '24 Meses',
          'Braçadeiras Incluídas': 'Adulto e Obeso',
          Display: 'LCD 6.5" Retroiluminado',
          'Validação Clínica': 'Protocolo ESH / AAMI',
        },
        imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
      },
      {
        company_id: companyHospi._id,
        name: 'Mesa Cirúrgica Hidráulica Multifuncional',
        description:
          'Mesa para cirurgias gerais com tampo radiotransparente para Raio-X e acionamento hidráulico suave.',
        price: 45000.0,
        isSale: false,
        category: 'Centro Cirúrgico',
        attributes: {
          Garantia: '24 Meses',
          'Capacidade Carga': '300 kg',
          Posições: 'Trendelenburg, Lateral, Flex',
          Tampo: 'Radiotransparente Raio-X',
        },
        imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
      },
    ];

    await Product.insertMany([...autoProducts, ...hospiProducts]);

    console.log('=======================================================');
    console.log('[Seed Engine] Carga de dados concluída com sucesso! (Seed Completed)');
    console.log('Credenciais de Teste Geradas (Test Credentials Available):');
    console.log('-------------------------------------------------------');
    console.log('1. Superadmin:       email: superadmin@admin.com | senha: password123');
    console.log('2. Admin Veículos:   email: admin@automotors.com | senha: password123');
    console.log('3. User Veículos:    email: user@automotors.com  | senha: password123');
    console.log('4. Admin Hospitalar: email: admin@hospitech.com  | senha: password123');
    console.log('5. User Hospitalar:  email: user@hospitech.com   | senha: password123');
    console.log('=======================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Erro ao popular o banco de dados:', error);
    process.exit(1);
  }
};

runSeed();
