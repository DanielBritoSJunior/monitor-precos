require('dotenv').config();
const mongoose = require('mongoose');

async function testarConexao() {
    console.log("🛠️ Iniciando teste de conexão...");
    console.log("🔗 Verificando chave no .env:", process.env.MONGO_URI ? "OK (Chave encontrada)" : "ERRO (Chave vazia)");

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🚀 BOOOA! Conectado com sucesso ao MongoDB Atlas!");
        
        // Se chegar aqui, a conexão funcionou!
        process.exit(0);
    } catch (err) {
        console.error("❌ Erro detalhado:");
        console.error("Mensagem:", err.message);
        console.error("Código do Erro:", err.code);
        process.exit(1);
    }
}

testarConexao();