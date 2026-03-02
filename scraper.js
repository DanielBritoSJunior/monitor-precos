const puppeteer = require('puppeteer');

// 1. Sua lista de desejos (Adicione quantos quiser aqui)
const produtos = [
    {
        nome: "Whey Max Titanium",
        url: "https://www.mercadolivre.com.br/whey-pro-concentrado-pote-1kg-max-titanium-sabor-morango/p/MLB6087971"
    },
    {
        nome: "Tenis Casual Kappa",
        url: "https://produto.mercadolivre.com.br/MLB-5408593708-tnis-casual-kappa-zenit-masculino-_JM?searchVariation=189765798025#polycard_client=offers&deal_print_id=fdd621d3-2121-4be7-b0bd-349c0406d0cb&position=4&tracking_id=c1d406c9-c090-4626-8492-6bf7150024af"
    }
];

async function monitorarTudo() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log(`🚀 Iniciando monitoramento de ${produtos.length} produtos...\n`);

    // 2. Loop para visitar cada link da lista
    for (const produto of produtos) {
        try {
            await page.goto(produto.url, { waitUntil: 'networkidle2' });
            await page.waitForSelector('[itemprop="price"]', { timeout: 10000 });

            const preco = await page.$eval('[itemprop="price"]', el => el.getAttribute('content'));
            
            console.log(`📌 ${produto.nome}: R$ ${preco}`);
            
        } catch (error) {
            console.error(`❌ Erro ao processar ${produto.nome}: ${error.message}`);
        }
    }

    await browser.close();
    console.log("\n✅ Verificação finalizada.");
}

monitorarTudo();