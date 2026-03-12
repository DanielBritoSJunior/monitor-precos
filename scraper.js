const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const axios = require('axios');

// O robô vai buscar esses valores automaticamente nas Secrets do GitHub
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const produtos = [
    {nome: "Air Fryer 4L", url: "https://www.mercadolivre.com.br/fritadeira-sem-oleo-air-fryer-4l-mondial-1500w-afn-40-bft/p/MLB23999810"},
    {nome: "Whey Protein Morango 1kg", url: "https://www.mercadolivre.com.br/whey-protein-concentrado-1kg-morango-dark-lab/p/MLB40182325"},
    {nome: "Micro-Ondas Preto 20L", url: "https://www.mercadolivre.com.br/micro-ondas-20l-preto-mastercook-midea/p/MLB61378955"}
];

async function enviarTelegram(msg) {
    if (!TOKEN || !CHAT_ID) {
        return console.log("⚠️ Chaves do Telegram não encontradas no ambiente.");
    }
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    try {
        await axios.post(url, { chat_id: CHAT_ID, text: msg });
        console.log("✈️ Alerta enviado para o Telegram!");
    } catch (e) {
        console.error("❌ Erro ao enviar para o Telegram:", e.message);
    }
}

async function monitorar() {
    console.log("🎬 Iniciando o monitor de ofertas...");
    
    const db = await open({
        filename: './precos_local.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            valor REAL,
            data DATETIME DEFAULT (datetime('now', 'localtime'))
        )
    `);

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const produto of produtos) {
        try {
            console.log(`🔍 Verificando: ${produto.nome}...`);
            await page.goto(produto.url, { waitUntil: 'networkidle2' });
            await page.waitForSelector('[itemprop="price"]', { timeout: 15000 });
            const precoAtual = parseFloat(await page.$eval('[itemprop="price"]', el => el.getAttribute('content')));

            const ultimo = await db.get('SELECT valor FROM historico WHERE nome = ? ORDER BY data DESC LIMIT 1', [produto.nome]);

            if (ultimo) {
                if (precoAtual < ultimo.valor) {
                    const alerta = `🔥 BAIXOU! ${produto.nome}\n💰 De R$ ${ultimo.valor} por R$ ${precoAtual}\n🛒 Link: ${produto.url}`;
                    await enviarTelegram(alerta);
                } else {
                    console.log(`➖ ${produto.nome}: R$ ${precoAtual} (Sem desconto novo)`);
                }
            } else {
                console.log(`🆕 Primeiro registro de ${produto.nome}: R$ ${precoAtual}`);
            }

            await db.run('INSERT INTO historico (nome, valor) VALUES (?, ?)', [produto.nome, precoAtual]);

        } catch (error) {
            console.error(`❌ Erro em ${produto.nome}: ${error.message}`);
        }
    }

    await browser.close();
    await db.close();
    console.log("🏁 Verificação finalizada.");
}

monitorar();