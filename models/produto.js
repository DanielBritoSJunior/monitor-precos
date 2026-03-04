const mongoose = require('mongoose')

const ProdutoSchema = new mongoose.Schema({
    nome:String,
    url:String,
    precoAtual:Number,
    historico: [
        {
            preco: Number,
            data: {type: Date, defalut: Date.now}
        }
    ]
})

module.exports = mongoose.model('Produto', ProdutoSchema)