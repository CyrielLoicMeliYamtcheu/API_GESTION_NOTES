const express = require('express')
const server = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true})
mongoose.connection.on('open', () => {
    console.log('Je suis connecté à ma base de données Mongo DB')
})


const Etudiants = require('./Models/etudiant.model')
const Niveaux = require('./Models/niveau.model')
const Specialite = require('./Models/specialite.model')


server.use(cors())
server.use(bodyParser.json())

server.get('/etudiant', async function (req, res) {
  const infos = await Etudiants.find()
  res.json(infos)
})

server.get('/etudiant/:id', async function (req, res) {
  const { id } = req.params
  const infos = await Etudiants.findOne({ _id: id })
  console.log(infos)
  res.json(infos)
})

server.post('/etudiant', async (req, res) => {
  const elem = req.body

  const niveau = await Niveaux.find({nom:elem.nom})
  console.log(niveau)
  const specialite = await Specialite.find({nom:niveau[0].nom})
  
  console.log(specialite)

  const Etudiant = new Etudiants({
    nom: elem.nom,
    prenom: elem.prenom,
    email: elem.email,
    password: elem.password,
    niveau: niveau,
    image: elem.image,
  })

 /* const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog)
  await user.save()
*/

  const infos = await Etudiants.create(Etudiant)
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()

})


server.put('/etudiant/:id', async (req, res) => {
  const { id } = req.params
  const elem = req.body
  const infos = await Etudiants.updateOne({ _id: id }, elem)
  console.log(infos)
  const status = infos.acknowledged ? 200 : 400
  res.writeHead(status)
  res.end()
})

server.delete('/etudiant/:id', async (req, res) => {
  const { id } = req.params
  const infos = await Etudiants.deleteOne({ _id: id })
  console.log(infos)
  res.writeHead(200)
  res.end()
})


server.post('/niveau', async (req, res) => {
  const elem = req.body
  const infos = await Niveaux.create(elem)
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()
})


server.post('/specialite', async (req, res) => {
  const elem = req.body
  console.log(elem.niveau)
  
  const niveau = await Niveaux.find({nom:elem.niveau})
  console.log(niveau)

  
  const infos = await Specialite.create({
      nom:elem.nom,
      niveaux: niveau[0].nom
  })
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()

  
})


server.listen(3100)