const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const produtos = [
    
    {nome: "Air Fryer 4L", url: "https://www.mercadolivre.com.br/fritadeira-sem-oleo-air-fryer-4l-mondial-1500w-afn-40-bft/p/MLB23999810#polycard_client=recommendations_home_second-trend-function-recommendations&reco_backend=second_trend_function&wid=MLB4671001440&reco_client=home_second-trend-function-recommendations&reco_item_pos=4&reco_backend_type=function&reco_id=908f2171-cfc2-45bc-82d8-1d03a3414d78&sid=recos&c_id=/home/second-trend-recommendations/element&c_uid=238e712f-1f23-40b5-b750-9fc73dc5e475"},
    {nome: "Whey Protein Morango 1kg", url: "https://www.mercadolivre.com.br/whey-protein-concentrado-1kg-morango-dark-lab/p/MLB40182325#polycard_client=recommendations_home_most-frequently-purchased-recommendations&reco_backend=recomm_platform_ranker_vip_v2p&wid=MLB5052087506&reco_client=home_most-frequently-purchased-recommendations&reco_item_pos=2&reco_backend_type=function&reco_id=ffef2a4c-b612-48e8-b7f1-c86ba1538704&sid=recos&c_id=/home/most-frequently-purchased-recommendations/element&c_uid=cb54196c-b936-4222-a454-1a3b3f6733da"},
    {nome: "Micro-Ondas Preto 20L", url: "https://www.mercadolivre.com.br/micro-ondas-20l-preto-mastercook-midea/p/MLB61378955#polycard_client=recommendations_home-deal-of-the-day&reco_backend=deal-of-the-day-model-odin&wid=MLB4280794927&reco_client=home-deal-of-the-day&reco_item_pos=0&reco_backend_type=low_level&reco_id=bf6876e0-0a3b-45ad-83d5-a04019b51b08&sid=recos&c_id=/home/today-promotions-recommendations/element&c_uid=af0e1b9a-82c4-490d-9a99-3a78c3a70a24"}

]

async function monitorar() {
    console.log("🎬 Preparando o robô e o banco de dados...");
    
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

    console.log("🌐 Abrindo o navegador...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const produto of produtos) {
        try {
            console.log(`🔍 Verificando agora: ${produto.nome}...`);
            await page.goto(produto.url, { waitUntil: 'networkidle2' });
            
            await page.waitForSelector('[itemprop="price"]', { timeout: 10000 });
            const precoAtual = parseFloat(await page.$eval('[itemprop="price"]', el => el.getAttribute('content')));

            const ultimo = await db.get('SELECT valor FROM historico WHERE nome = ? ORDER BY data DESC LIMIT 1', [produto.nome]);

            if (ultimo) {
                if (precoAtual < ultimo.valor) {
                    console.log(`🔔 ALERTA: O preço de ${produto.nome} BAIXOU! (De R$ ${ultimo.valor} para R$ ${precoAtual})`);
                } else {
                    console.log(`➖ ${produto.nome}: R$ ${precoAtual} (Sem desconto novo)`);
                }
            } else {
                console.log(`🆕 Primeiro registro de ${produto.nome}: R$ ${precoAtual}`);
            }

            await db.run('INSERT INTO historico (nome, valor) VALUES (?, ?)', [produto.nome, precoAtual]);

        } catch (error) {
            console.error(`❌ Erro ao acessar ${produto.nome}: ${error.message}`);
        }
    }

    console.log("🏁 Tudo pronto! Fechando navegador...");
    await browser.close();
    await db.close();
}

monitorar();