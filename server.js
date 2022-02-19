const express = require('express')
const server = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const session = require('express-session');
const MongoDBStore = require("connect-mongodb-session")(session);

mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true})
mongoose.connection.on('open', () => {
    console.log('Je suis connecté à ma base de données Mongo DB')
})


const Etudiants = require('./Models/etudiant.model')
const Niveaux = require('./Models/niveau.model')
const Specialite = require('./Models/specialite.model')
const Modules = require('./Models/module.model')
const Matieres = require('./Models/matiere.model')
const Enseignants = require('./Models/enseignant.model')

const MAX_AGE = 1000 * 60 * 60 * 3; // Three hours
const mongoDBstore = new MongoDBStore({
  uri: 'mongodb://localhost:27017/test',
  collection: "mySessions"
});


server.use(cors())
server.use(bodyParser.json())

/*
server.use(session({ secret: 'keyboard cat',
resave: true,
saveUninitialized: false,
cookie: { maxAge: 60000, secure:false }
}));

*/

const IS_PROD = false
const COOKIE_NAME = 'keyboard'
const SESS_SECRET = 'keyboard cat'
// Express-Session
server.use(
  session({
    name: COOKIE_NAME, //name to be put in "key" field in postman etc
    secret: SESS_SECRET,
    resave: true,
    saveUninitialized: false,
    store: mongoDBstore,
    cookie: {
      maxAge: 60000,
      sameSite: false,
      secure: IS_PROD
    }
  })
)




/* ******************************** LOGIN & INSCRIPTION ETUDIANT ********************************************** */
// endpoint pour le login de connexion

server.post('/signin', async function (req, res) {
    const elem = req.body
    console.log(elem)
    if (!elem.email || !elem.password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

    //check for existing user
    const infos = await Etudiants.findOne({email: elem.email})
    console.log(infos)
    // Validate password
    if(infos && bcrypt.compareSync(elem.password, infos.password)){
      console.log("le mot de passe correspond")
      const status = infos.acknowledged ? 201 : 400
      
      const sessUser = { id: infos._id, nom: infos.nom, email: infos.email, prenom: infos.prenom };
      req.session.Etudiant = sessUser; // Auto saves session data in mongo store

      res.json({ msg: " Logged In Successfully", sessUser }); // sends cookie with sessionID automatically in response
   
    

    }

  // res.writeHead(status)
  // res.end()

  /*
    
    User.findOne({ email }).then((user) => {
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

      const sessUser = { id: user.id, name: user.name, email: user.email };
      req.session.user = sessUser; // Auto saves session data in mongo store

      res.json({ msg: " Logged In Successfully", sessUser }); // sends cookie with sessionID automatically in response
   
    */

})

// endpoint pour l'inscription de l"etudiant
server.post('/signup', async function (req, res){
  const elem = req.body

  const niveau = await Niveaux.find({nom:elem.niveau})
  console.log(niveau)
  const password = bcrypt.hashSync(elem.password, 10);
  console.log(password)

  Etudiants.findOne({ email: elem.email }).then(async (user) => {
    if (user) return res.status(400).json({ msg: "Etudiant already exists" });
  
  // New Etudiant created
  const infos = await Etudiants.create({
    nom:elem.nom,
    prenom: elem.prenom,
    email: elem.email,
    password: password,
    niveau: niveau[0]._id,
    specialite: elem.specialite,
    image: elem.image,
    notes: elem.notes
  })

    const status = infos._id ? 201 : 400
    res.writeHead(status)
    res.end()

  })

})

// Cette route est utilisée pour acceder à la page d'acceuil de notre application React
server.get("/authchecker", (req, res) => {
  const sessUser = req.session.Etudiant
  if (sessUser) {
    return res.json({ msg: " Authenticated Successfully", sessUser })
  } else {
    return res.status(401).json({ msg: "Unauthorized" })
  }
})

// GET logout
server.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});


server.delete("/logout", (req, res) => {
  req.session.destroy((err) => {
    //delete session data from store, using sessionID in cookie
    if (err) throw err;
    res.clearCookie("session-id"); // clears cookie containing expired sessionID
    res.send("Logged out successfully");
  });
});


/*************************** */

server.get('/etudiant', async function (req, res) {
  const infos = await Etudiants.find().populate("niveau")
  res.json(infos)
})


server.get('/etudiant/:id', async function (req, res) {
  const { id } = req.params
  const infos = await Etudiants.findOne({ _id: id }).populate("niveau")
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
    niveau: niveau[0]._id,
    specialite: elem.specialite,
  
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


// endpoint update etudiant

server.put('/etudiant/:id', async (req, res) => {
  const { id } = req.params
  const elem = req.body
  const infos = await Etudiants.updateOne({ _id: id }, elem)
  console.log(infos)
  const status = infos.acknowledged ? 200 : 400
  res.writeHead(status)
  res.end()
})

// endpoint delete etudiant

server.delete('/etudiant/:id', async (req, res) => {
  const { id } = req.params
  const infos = await Etudiants.deleteOne({ _id: id })
  console.log(infos)
  res.writeHead(200)
  res.end()
})


/* *******************************************************  NIVEAU *************************************** */

// endpoint create niveau (classe)

server.post('/niveau', async (req, res) => {
  const elem = req.body
  const infos = await Niveaux.create(elem)
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()
})

// endpoint affichage des niveaux

server.get('/niveau', async function (req, res) {
  const infos = await Niveaux.find()
  res.json(infos)
  console.log(infos)
})


/* *************************************************  SPECIALITE *************************************  */
// endpoint create specialite

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

// endpoint affichage des specialités
server.get('/specialite', async function (req, res) {
  const infos = await Specialite.find().populate("niveaux")
  res.json(infos)
  console.log(infos)
})

/* ********************** MODULES ***********************************/

server.get('/module', async function(req, res){
  const infos = await Modules.find().populate("niveau")
  res.json(infos)
  console.log(infos)
})

server.post('/module', async function(req, res){
  const elem = req.body
  const niveau = await Niveaux.find({nom:elem.niveau})
  console.log(niveau)
  const infos = await Modules.create({
      nom:elem.nom,
      coef_module: elem.coef_module,
      niveau: niveau[0]._id
  })
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()

})


/******************************* MATIERES ***************************** */

server.get('/matiere', async function(req, res){
  const infos = await Matieres.find().populate("modules")
  res.json(infos)
  console.log(infos)
})

server.post('/matiere', async function(req, res){
  const elem = req.body
  const module = await Modules.find({nom:elem.modules})
  console.log(module)
  const infos = await Matieres.create({
      nom:elem.nom,
      intitule:elem.intitule,
      coef: elem.coef,
      modules: module[0]._id
  })
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()

})


/* **********************  ENSEIGNANT ******************************/

server.get('/enseignant', async function(req, res){
  const infos = await Enseignants.find().populate("matiere")
  res.json(infos)
  console.log(infos)
})


async function getCourseID(nom) {
	const myQuery = { nom: nom };
	const matieres = await Matieres.find(myQuery);
	//log.info("THIS IS THE COURSE ID", courseID);
	return matieres[0]._id;
}


server.post('/signupEnseignant', async function(req, res){
  const elem = req.body
  const password = bcrypt.hashSync(elem.password, 10);

  Enseignants.findOne({ email: elem.email }).then(async (user) => {
    if (user) return res.status(400).json({ msg: "Enseignant already exists" });
  
  const infos = await Enseignants.create({
      nom:elem.nom,
      prenom:elem.prenom,
      email: elem.email,
      password: password
  })

  const status = infos._id ? 201 : 400

    if(status == 201){
      let { email, matieres } = req.body;
      matieres.forEach(async (matiere) => {
          const courseID = await getCourseID(matiere);
          console.log("THIS IS IT", courseID);
          const myUpdate = { $push: { matiere: courseID } };
          Enseignants.updateOne({ email: email }, myUpdate, (err, res1) => {
            if (err) {
              res.status(500);
            }
        
            })
          })
      }
    res.writeHead(status)
    res.end()

	    })

  })


server.post('/signinEnseignant', async function(req, res){
  const elem = req.body

  if (!elem.email || !elem.password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  
    //check for existing user
    const infos = await Enseignants.findOne({email: elem.email})
    console.log(infos)

    // Validate password
    if(infos && bcrypt.compareSync(elem.password, infos.password)){
      console.log("le mot de passe correspond")
      const status = infos.acknowledged ? 201 : 400

      const sessUser = { id: infos._id, nom: infos.nom, email: infos.email, prenom: infos.prenom };
      req.session.Enseignant = sessUser; // Auto saves session data in mongo store

      res.json({ msg: " Logged In Successfully", sessUser }); // sends cookie with sessionID automatically in response
   
     // res.writeHead(status)
     // res.end()

    } 
})


// Cette route est utilisée pour acceder à la page d'acceuil de notre application React
server.get("/authcheckerEns", (req, res) => {
  const sessUser = req.session.Enseignant
  if (sessUser) {
    return res.json({ msg: "Authenticated Successfully", sessUser })
  } else {
    return res.status(401).json({ msg: "Unauthorized" })
  }

})



server.listen(3100)