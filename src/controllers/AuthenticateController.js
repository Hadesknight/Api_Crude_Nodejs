const User = require("../models/user")
const bcrypt = require('bcryptjs')
const Token = require('../config/Token')
const crypto = require('crypto')




//agora com o jsonwebtoken importado, vamos gerar o token para validar a sessão
//usaremos a função sign do jwt.. nela passaremos 3 paremetros
//o primeiro algo q seja unico no login, no caso usamos o id
//e depois um hash md5, que podemos gerar separadamente na pasta config, arquivo auth.json
//como "secret": "AQUI A HASH"
//e por ultimo o o tempo para expirar o parametro, 86400 seria 1 dia
//como esta em função, no params vamos receber o id do cliente gerado



module.exports = {
    async store(req, res) {
        //pegando e-mail e pass no corpo do login
        const { email, password } = req.body

        //conferindo se o usuario existe no banco de dados, e pegando os dados dele
        //adicionando o parametro +password, pq anteriormente setamos no banco para ele nao aparecer
        const user = await User.findOne({ email }).select('+password')


        //se o usuario nao existir, retornamos o erro
        if (!user) {
            return res.status(400).send({ error: "User not found" })
        }

        //se ele existir, vamos conferir se a senha esta correta
        //vamos descryptografar
        //comparando as senhas com bcrypt, usando await, pq é asyncrona
        if (!await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ error: "Invalid Password" })
        }

        user.password = undefined




        //se a o usuario existe, e a senha esta correta, retornamos os dados do usuario
        return res.json({
            user,
            token: Token.generateToken({ id: user._id })
        })

    },

    async forgot(req, res) {
        const { email } = req.body

        try {
            //vamos conferir se o e-mail existe no banco de dados, e apos isso
            //vamos gerar um token para enviar para o e-mail
            //usando o crypto do nodejs
            const user = await User.findOne({ email })
            if (!user) {
                return res.status(400).json({ message: "User not found" })
            }

            //aqui vamos gerar um token, de 20 caracters, em hex, para enviar
            const token = crypto.randomBytes(20).toString('hex')
            //agora, vamos pegar a data, e setar o tempo que o token funciona
            //no caso vamos colocar para 1 hora
            const now = new Date()
            now.getHours(now.getHours() + 1)

            //geramos os campos para guardar o token e a data de expiração no banco
            //agora vamos atualizar o banco, com os dados

            console.log("Buscamos, e mostramos, falta atualizar")
            await User.findByIdAndUpdate(user.id, {
                //para atualizar o banco, vamos procurar pelo id
                //em seguida usar o $set para dizer quais são os campos queremos atualizar
                '$set': {
                    passwordResetToken: token,
                    passwordResetExpires: now,
                }
            })

            console.log(token, now)

        } catch (err) {
            return res.status(400).json({ error: "Failed on forgot password, try again" })
        }
    }
}