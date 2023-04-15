const express = require("express");
const path = require("path");
// const fs = require("fs");
const app = express();
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const bodyParser = require("body-parser");
// const bcrypt = require('bcrypt');

const sendEmail= require('./sendmail')

const port = 800;

app.use(express.json());
const session=require('express-session');
const cookieParser=require('cookie-parser');
const flash= require('connect-flash');
app.use(cookieParser('SecretStringForCookie'));
app.use(session({
  secret: 'my-secret-key',
  resave: false,
  cookie:{Maxage:60000},
  saveUninitialized: true,
}));
//  cookie:{Maxage:60000},
app.use(flash());
// console.log("wdfg");
const mongoose = require('mongoose');
const { request } = require("http");
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/RegisterSchema');
  console.log("connected");
}

const RegisterSchema = new mongoose.Schema({
  name: String,
  email: String,
  Password: String
});
const otpschema = new mongoose.Schema({
  email: String,
  Password: String,
  otp:String
});

// Create a new model for the new collection
const otppass = mongoose.model('otppass', otpschema);
const Signup = mongoose.model('Signup', RegisterSchema);
// const optpass = mongoose.model('reset', otpSchema);

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
  // req.flash('isLoggedIn', isLoggedIn);
  res.status(200).render('main.html');
})
app.get('/Signup', (req, res) => {
  const param = {}
  res.status(200).render('login2.html',{message: req.flash('message')});
})
app.get('/confirm', (req, res) => {
  const param = {}
  res.status(200).render('confirm.html',{message: req.flash('message')});
})

app.get('/home', (req, res) => {
  // const param = {}
  res.status(200).render('home.html');
})

app.get('/meeting', (req, res) => {
  // const param = {}3
  res.status(200).render('meeting.html');
})

app.get('/forget', (req, res) => {
  res.status(200).render('forget.html',{message: req.flash('message')});
})
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
    } else {
       
      res.redirect('/');
    }
  });
});
app.post('/Signup', async(req, res) => {
  const email = req.body.email;
  const name = req.body.name;
  const pwd = req.body.Password;
  const useremail=  await Signup.findOne({email:email});
  if( useremail && useremail.email=== email){
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
        // const element=getElementById("alert-message")
        if(email.length==0){
          req.flash('message', ' Enter valid email details');
          res.redirect("/Signup");
        }
        else {

          const password= req.body.Password;
          const useremail=  await Signup.findOne({email:email});
          //  console.log(useremail.Password);
          console.log(password);
          
          if(useremail.Password === password){
            res.redirect("/home");
          }else{
            req.flash('message', ' invalid login details');
            res.redirect("/Signup");
          }
        }
        }catch(error){
          req.flash('message', ' invalid login details');
          res.redirect("/Signup");
    }
})

function generateOTP(length) {
  const charset = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return otp;
}

app.post('/forget', async(req, res) =>{
      const email= req.body.Email;
      const pass= req.body.NewPassword;
      const cpass= req.body.ConfirmPassword;
      const user = await Signup.findOne({ email: email });
  if (!user) {
    req.flash('message', 'This email is not registered. Please try using your registered email.');
    return res.redirect('/forget');
  }

  try{
    if(pass!=cpass){
      req.flash('message', 'Enter password correctly');
      return res.redirect('/forget');
    }

    else{
      const otp = generateOTP(6); // generate a 6-digit OTP
      console.log(otp);
      
      // await Signup.updateOne({ email: email }, { $set: { Password: pass } });
      const mydata = new otppass({
        email, Password: cpass,otp
      });
      sendEmail(email, otp);
   mydata.save().then(() => {
    req.flash('message', 'Otp has set to your registered gmail');
    res.redirect("/confirm");
 
   }).catch((err) => {
     console.log(err);
     res.status(400).send("This data has not been saved to the database")
   })
      // req.flash('message', 'password changed successfully');
      // return res.redirect('/Signup');
    }

  }
  catch (err) {
    console.log(err);
    req.flash('message', 'An error occurred while updating your password. Please try again later.');
    res.redirect('/forget'); 
  }

});
  app.post('/confirm', async(req, res) =>{
      const  uotp= req.body.otp;
      const user = await otppass.findOne({ otp: uotp });
      if(!user){
         req.flash('message', 'Enter valid otp');
         res.redirect("/confirm");
      }
      else{
        const user1 = await Signup.findOne({ email: user.email });
        if(!user1){
          req.flash('message', 'Enter valid otp');
          res.redirect("/confirm");
        }
        else{
          await Signup.updateOne({$set: { email: user.email, Password: user.Password } });
          req.flash('message', 'Password changed successfully');
          res.redirect("/signup");
        }

      }

  });
app.listen(port, () => {
  console.log(` the application is successfully started at port ${port}`);
}); 
