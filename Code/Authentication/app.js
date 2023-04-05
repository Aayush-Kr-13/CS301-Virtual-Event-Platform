const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const ejs = require('ejs');
const bodyParser = require("body-parser");
const port = 800;

app.use(express.json());
const session=require('express-session');
const cookieParser=require('cookie-parser');
const flash= require('connect-flash');
app.use(cookieParser('SecretStringForCookie'));
 app.use(session({
    secret:'secretstringforsession',
    cookie:{Maxage:60000},
    resave:true,
    saveUninitialized:true
 }));
app.use(flash());

//database connection
const mongoose = require('mongoose');
const { request } = require("http");
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/RegisterSchema');
  console.log("connected");
}

// schema 
const RegisterSchema = new mongoose.Schema({
  name: String,
  email: String,
  Password: String
});

// model conversion
const Signup = mongoose.model('Signup', RegisterSchema);

// express specific stuff
app.use('/static', express.static('static')) // for serving static files
app.use(express.urlencoded({ extended: true }))

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const static_path = path.join(__dirname, "/views");
app.use(express.static(static_path))
app.set('views', path.join(__dirname, '/views'));

// endpoints
app.get('/', (req, res) => {
  const param = {}
  res.status(200).render('home.html', param);
})
app.get('/Signup', (req, res) => {
  const param = {}
  res.status(200).render('login2.html',{message: req.flash('message')});
})
app.get('/meeting', (req, res) => {
  const param = {}
  res.status(200).render('meeting.html', param);
})
app.get('/main', (req, res) => {
  const param = {}
  res.status(200).render('main.html', param);
})

app.post('/signup', async(req, res) => {
  const email = req.body.email;
  const name = req.body.name;
  const pwd = req.body.Password;
  const useremail=  await Signup.findOne({email:email});
  if( useremail && useremail.email=== email){
      // emailexists=true;
      req.flash('message', ' Email already exists');
      res.redirect('/Signup');
  }
  const mydata = new Signup({
     name,email, Password:pwd
  });
  mydata.save().then(() => {
    res.render("home.html");

  }).catch((err) => {
    console.log(err);
    res.status(400).send("This data has not been saved to the database")
  })
})
//login  ------
app.post('/login', async(req, res) => {
    try{
        const email=req.body.email;
        const password= req.body.password;
       const useremail=  await Signup.findOne({email:email});
       if(useremail.Password === password){

        res.redirect("/");
       }else{
          req.flash('message', ' invalid login details');
        res.redirect("/Signup");
       }
    }catch(error){
      res.status(400).send("Invalid login details");
    }
})
app.listen(port, () => {
  console.log(` the application is successfully started at port ${port}`);
}); 
