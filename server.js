const express = require('express')
const server = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const session = require('express-session');
const MongoDBStore = require("connect-mongodb-session")(session);

mongoose.connect('mongodb://localhost:27017/gestion_note', {useNewUrlParser: true})
mongoose.connection.on('open', () => {
    console.log('Je suis connecté à ma base de données Mongo DB')
})


const Etudiants = require('./Models/etudiant.model')
const Niveaux = require('./Models/niveau.model')
const Specialite = require('./Models/specialite.model')
const Modules = require('./Models/module.model')
const Matieres = require('./Models/matiere.model')
const Enseignants = require('./Models/enseignant.model')
const Users = require('./Models/user.model')

const MAX_AGE = 1000 * 60 * 60 * 3; // Three hours
const mongoDBstore = new MongoDBStore({
  uri: 'mongodb://localhost:27017/gestion_note',
  collection: "mySessions"
});


server.use(cors())
server.use(bodyParser.json())

/*
server.use(session({ secret: 'keyboard cat',
resave: true,
saveUninitialized: true,
cookie: { maxAge: 6000000, secure:false }
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
    saveUninitialized: true,
    store: mongoDBstore,
    cookie: {
      maxAge: MAX_AGE,
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

})


server.post('/signinuser', async function (req, res) {
    const elem = req.body
    console.log(elem)
    if (!elem.email || !elem.password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

    //check for existing user
    const infos = await Users.findOne({email: elem.email})
    console.log(infos)
    // Validate password
    
    if(infos && bcrypt.compareSync(elem.password, infos.password)){
      console.log("le mot de passe correspond")
      
      const status = infos.acknowledged ? 201 : 400
      const sessUser = { id: infos._id, nom: infos.nom, email: infos.email, prenom: infos.prenom, role: infos.role };
      req.session.user = sessUser // Auto saves session data in mongo store
      
      req.session.save()
       res.json(req.session)
    // res.json({ msg: " Logged In Successfully", sessUser}); // sends cookie with sessionID automatically in response
    
    }else{
      console.log("Erreur de connexion: veuillez vérifier vos identifiants password et email")
    }

    // res.writeHead(status)
    
  //  res.end()

})

server.get("/authchecker", (req, res) => {
  const sessUser = req.session.user
  console.log("session user" , sessUser)
  console.log("console ", req.session)

  if (sessUser) {
    return res.json({ msg: " Authenticated Successfully", sessUser })
  } else {
    return res.status(401).json({ msg: "Unauthorized" })
  }
})

// Authentication and Authorization Middleware
function auth(req, res, next) {
  if (req.session && req.session.user === "amy" && req.session.admin)
    return next();
  else
    return res.sendStatus(401);
};

// endpoint pour l'inscription de l"etudiant
server.post('/signup', async function (req, res){
  const elem = req.body

  const niveau = await Niveaux.findOne({nom:elem.niveau})
  console.log("document niveau est : ")
  console.log(niveau)
  const password = bcrypt.hashSync(elem.password, 10);
  // console.log(password)

  Users.findOne({ email: elem.email }).then(async (user) => {
    if (user) return res.status(400).json({ msg: "Etudiant already exists" });
  
  const infos = await Users.create({
    nom: elem.nom,
    prenom: elem.prenom,
    email: elem.email,
    password: password,
    role: "Etudiant"
  })

  if(infos !== null){

  // New Etudiant created
  const infos2 = await Etudiants.create({
    nom:elem.nom,
    prenom: elem.prenom,
    email: elem.email,
    password: password,
    matricule: elem.matricule,
    niveau: niveau._id,
    specialite: elem.specialite,
    image: elem.image,
    notes: elem.notes,
    user: infos._id
  })

  console.log("Etudiant " ,infos2)

    
    const status2 = infos2._id ? 201 : 400
    res.writeHead(status2)
    
    res.end()
  }

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
    })
  }
})


server.delete("/logout", (req, res) => {
  req.session.destroy((err) => {
    //delete session data from store, using sessionID in cookie
    if (err) throw err;
    res.clearCookie("session-id"); // clears cookie containing expired sessionID
    res.send("Logged out successfully");
  })
})


/*************************** ETUDIANT ************************************************/

server.get('/etudiant', async function (req, res) {
  const infos = await Etudiants.find().populate("niveau")
  res.json(infos)

})


server.get('/etudiant/:specialite', async function (req, res) {
  const { specialite } = req.params
  const infos = await Etudiants.find({ specialite: specialite }).populate("niveau")
  console.log(infos)
  res.json(infos)

})


server.post('/etudiant', async (req, res) => {
  const {niveau, specialite} = req.body

  const niv = await Niveaux.findOne({nom:niveau})
  console.log(niv)
  const special = await Specialite.find({nom:specialite})
  
  console.log(special)
  const infos = await Etudiants.find({ specialite: specialite }, {niveau: niveau})
  console.log(infos)
  res.json(infos)

})

/*

server.get('/etudiant/:specialite', async (req, res) => {
  const { specialite } = req.params
  const infos = await Etudiants.find({ specialite:specialite })
  console.log(infos)
  res.json(infos)
})


*/


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
  console.log(elem.niveaux)
  
  const niveau = await Niveaux.findOne({nom:elem.niveaux})
  console.log(niveau) 
  const infos = await Specialite.create({
      nom:elem.nom,
      niveaux: niveau
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
  const niveau = await Niveaux.findOne({nom:elem.niveau})
  console.log(niveau)
  const infos = await Modules.create({
      nom:elem.nom,
      coef_module: elem.coef_module,
      niveau: niveau
  })
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()

})


/******************************* MATIERES ***************************** */

server.get('/matiere/:specialite', async function (req, res) {
  const { specialite } = req.params
  const infos = await Matieres.find()

  console.log(infos)
  infos.forEach(async (item) => {
    const specialites = await item.specialite
    specialites.forEach(async (value) => {
        if(value.nom === specialite){
          res.json(infos)
        }
    })
  })
  
})


server.get('/matiere', async function(req, res){
  const infos = await Matieres.find()
  res.json(infos)
  console.log(infos)
})


server.post('/matiere', async function(req, res){
  const elem = req.body
  const module = await Modules.find({nom:elem.modules},{niveau: elem.niveau.nom}).populate("niveau")
  console.log(module)
  
  const specialite = await Specialite.find({nom:elem.specialite},{niveaux: elem.niveau.nom}).populate("niveaux")
  console.log(specialite)

  const infos = await Matieres.create({
      nom:elem.nom,
      intitule:elem.intitule,
      coef: elem.coef,
      modules: module,
      niveau: elem.niveau,
      specialite: specialite
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


server.get('/enseignant/:id', async function(req, res){
   const { id } = req.params
  const infos = await Enseignants.findOne({_id : id}).populate("matiere")
  res.json(infos)
  console.log(infos)
})


async function getCourseID(intitule) {
	const myQuery = { intitule: intitule };
	const matieres = await Matieres.findOne(myQuery);
	return matieres;
}


server.post('/signupEnseignant', async function(req, res){
  const elem = req.body
  const password = bcrypt.hashSync(elem.password, 10);

  Users.findOne({ email: elem.email }).then(async (user) => {
    if (user) return res.status(400).json({ msg: "Enseignant already exists" });
  
  const infos = await Users.create({
    nom: elem.nom,
    prenom: elem.prenom,
    email: elem.email,
    password: password,
    role: "Enseignant"
  })

  if(infos !== null){
    const infos2 = await Enseignants.create({
      nom:elem.nom,
      prenom:elem.prenom,
      email: elem.email,
      password: password,
      user: infos._id
  })

   let { email, matiere } = req.body;
      matiere.forEach(async (course) => {
          const courseID = await getCourseID(course);
          console.log("THIS IS IT", courseID);
          const myUpdate = { $push: { matiere: courseID } };
          Enseignants.updateOne({ email: email }, myUpdate, (err, res1) => {
            if (err) {
              res.status(500);
            }
        
        })
    })

     const status = infos2._id ? 201 : 400 
    res.writeHead(status) 
    res.end()

  }
   

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

      res.json(req.session)
      //const sessionID = {id: infos._id}
      //req.session.teacher = sessionID
      // res.json({ msg: " Logged In Successfully", sessUser }); // sends cookie with sessionID automatically in response
   
    } 
})


// Cette route est utilisée pour acceder à la page d'acceuil de notre application React
server.get("/authcheckerEns/:id", (req, res) => {
  const { id } = req.params
  console.log("idddd " , id)
  console.log("reqqq  ",req.session)
  const sessUser = req.session.user
  if(id.toString() === sessUser.id.toString()){
    console.log("helloooo ", sessUser)
    console.log("userrrrr" , req.session)
    if (sessUser) {
      console.log("suceess")
      return res.json({ msg: "Authenticated Successfully", sessUser })
    } else {
      console.log("error")
      return res.status(401).json({ msg: "Unauthorized" })
    }

  }
})


// gestion des notes

async function getEtudiant(matricule) {
	const myQuery = { matricule: matricule };
	const etudiants = await Etudiants.findOne(myQuery);
	//log.info("THIS IS THE COURSE ID", courseID);
	return etudiants._id;
}


exports.updateNoteEtudiant = (req, res) => {
	let { email, matieres } = req.body;

	matieres.forEach(async (matiere) => {
		const courseID = await getCourseID(matiere);
		log.info("THIS IS IT", courseID);
		const myUpdate = { $push: { matiere: courseID } };
		teacher.updateOne({ email: email }, myUpdate, (err, res1) => {
			if (err) {
				res.status(500);
			}
			log.info("MESSAGE DONE");
		});
	});
};

server.post('/note', async function(req, res){
  let { matricule, notes }  = req.body
  notes.forEach(async (note) => {
		const etudiantID = await getEtudiant(matricule);
    if(etudiantID !== null){
		const myUpdate = { $push: { note: note } };
		Etudiants.updateOne({ matricule: matricule }, myUpdate, (err, res1) => {
			if (err) {
				res.status(500);
			}
			console.log("MESSAGE DONE");
		});

  }

	});
   
})

/*

{
        "nom": "Lydie",
        "prenom": "Diana",
        "email": "lydie@gmail.com",
        "password": "lydie",
        "matiere": ["C# sous Windows","Administration Réseaux Appliquée"]
        
  }


  {
        "nom": "BRSSIP2",
        "intitule": "Administration Réseaux Appliquée",
        "coef": 2,
        "modules": "RÉSEAU",
        "niveau": "Master 1",
        "specialite": ["Data Science","Cybersecurité"]
        
  }


   {
        "nom":"Theophile2",
        "prenom":"Pascal2",
        "email": "theo2@gmail.com",
        "password": "123456",
        "matricule":"657621",
        "niveau": "Master 1",
        "specialite": "Cybersecurité"
       
  }


*/


server.listen(3100)