const express = require('express');
const ejs = require('ejs');
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const passportSetup = require('./config/passport-setup');
const mongoose = require("mongoose");
const keys = require('./config/keys');
const cookieSession = require('cookie-session');
const passport = require('passport');
const stripe = require('stripe')('sk_test_78heIHdLps9DPXfNzzhcUZBG00xnLO3F2k'); // Add your Secret Key Here
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const Customer = require(__dirname+'/models/customer-model');
const Covid = require(__dirname+'/models/covid-model');
var nodemailer = require('nodemailer');
const saltRounds = 10;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// set view engine
app.set('view engine', 'ejs');

app.engine('html', require('ejs').renderFile);

app.use(express.static(path.join(__dirname, './views')));

app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [keys.session.cookieKey]
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// set up routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);


// create Mongo connection
mongoose.connect(keys.mongodb.dbURL, {useNewUrlParser: true, useUnifiedTopology: true}, () => {

    console.log('Connected to mongoDB');
});


// create home route
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
});


app.post('/welcome-login', (req, res) => {
    
    res.render("profile", {user: req.body.user, result: req.body.result});

});



app.get('/covid-form', (req, res) => {
    res.render("covid-form");
});

app.post('/covid-form', (req, res) => {
    
    if(req.body.income > 2)
        res.render("failure-page");

    else
    {
    const newCovid = new Covid
    ({
    
    email: req.body.email,
    name: req.body.name,
    contact: req.body.contact,
    income: req.body.number,
    hospital: req.body.hsopital 

    });

    newCovid.save(function(err)
    {
    if(err)
       console.log(err);
    else
       res.render("Success-page", {name: req.body.name, hospital: req.body.hospital});
    });

    
    }

});

app.get('/home', (req, res) => {
    res.render("home", {user: req.user});
});

app.get('/Covid-info', (req, res) => {
    res.render("Covid-info");
});

app.get('/donate', (req, res) => {
    res.sendFile(__dirname + "/views/indexx.html");
});


app.get('/auth/login-form', (req, res) => {
    res.render("login-form");
});

app.get('/auth/customer-login', (req, res) => {
    res.render("customer-login");
});

app.post('/balance', (req, res) => {

let uniqueId = req.body.id;
Customer.findOne({uniqueId: uniqueId}, function(err, foundCustomerr)
{
    if(foundCustomerr)
    {  
       let message= "Your Account Balance is " + foundCustomerr.balance;       
       res.render("info", {balance: message});               
    }
    else
    {
       res.send("Error Occurred, Try later!");   
    }
    
})

});


app.post('/fundTransfer', (req, res) => {

let uniqueId = req.body.fundId;
Customer.findOne({uniqueId: uniqueId}, function(err, foundCust)
{
    if(foundCust)
    {  
       let arr = foundCust.beneficiary;
       res.render("fund-transfer", {arr: arr});              
    }
    else
    {
       res.send("Error Occurred, Try later!");   
    }
    
})

});

app.post('/fund-transfer', (req, res) => {
 

 let amount = req.body.amount;
 let amt = -amount;
 Customer.findOneAndUpdate({ accountNo: req.body.fromAccount }, { $inc: { balance: amt } }, {new: true },function(err, response) { });
 Customer.findOneAndUpdate({ accountNo: req.body.toAccount }, { $inc: { balance: amount } }, {new: true },function(err, response) { }); 
 res.render("fund-success-page");


});

// Create route for email password login

const Schema = mongoose.Schema;

app.post("/login-form", function(req,res){

bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    
    const newCustomer = new Customer({
    uniqueId: req.body.googleId,
    email: req.body.email,
    password: hash,
    income: req.body.income,
    account: req.body.account,
    balance: req.body.balance,
    accountNo: req.body.accountNo,
    address: req.body.state,
    contact: req.body.contact,
    pin: req.body.pin

});

newCustomer.save(function(err)
{
    if(err)
       console.log(err);
    else
       res.send('Success!!');
});
  

});

});


app.post("/customer-login", function(req,res){

const email = req.body.email;
const password = req.body.password;

Customer.findOne({email: email}, function(err, foundCustomer)
{
    if(err)
        console.log(err);
    else
    {
        if(foundCustomer)
        {
            bcrypt.compare(password, foundCustomer.password, function(err, result) 
            {
                  if(result == true)
                     res.render("profile", {user: foundCustomer.uniqueId, result: true });
            });
               
        }
    }
})

});

app.post("/charge", (req, res) => {
  
  let amount = parseInt((req.body.amount)/2);
  try {
    stripe.customers
      .create({
        name: req.body.name,
        email: req.body.email,
        source: req.body.stripeToken
      })

      .then(() => Customer.findOneAndUpdate({ accountNo: req.body.accountNo }, { $inc: { balance: -amount } }, {new: true },function(err, response) { }))
      .then(() => res.render("completed.html"))
      .catch(err => console.log(err));
  } catch (err) {
    res.send(err);
  } 

});


app.get('/beneficiary', (req, res) => {
    res.render("add-benef");

});

app.post('/beneficiary', (req, res) => {
    
Customer.findOneAndUpdate({ accountNo: req.body.accountM }, { $push: { beneficiary: req.body.accountB } }, {new: true },function(err, response) { })

res.render("pin-success");


});


app.post('/change-pin', (req, res) => {
    
res.render("change-pin-page", {id: req.body.id});

});

app.post('/changePIN', (req, res) => {
    
let uniqueId = req.body.id;
let oldPin = req.body.oldPin;
let newPin = req.body.newPin;

Customer.findOne({uniqueId: uniqueId}, function(err, foundCustomer)
{
    if(foundCustomer)
    {
       let pin = foundCustomer.pin; 
       if(pin == oldPin) 
       {
       // res.render("otp-page", {givenId: uniqueId});

       var email = foundCustomer.email;
       var transporter = nodemailer.createTransport({

       service: 'gmail',
       auth: 
       {
        user: 'kawatrarewa@gmail.com',
        pass: 'Rewanidhi@'
       }

       });
  
       let number = parseInt(Math.random()*100000);
       var mailOptions = 
       {

        from: 'Admin@republica.com',
        to: email,
        subject: 'OTP For Changing banking PIN',
        text: "The one time pin for changing your bank pin is "+ number +"."+"This OTP is valid for 5 mins only. DO NOT share it with anyone."

       };

       transporter.sendMail(mailOptions, function(error, info){
       if (error) 
       {
         console.log(error);
       } 
       else 
       {
         res.render("otp-page", {givenId: uniqueId, otp: number, newPin: newPin});
         // console.log('Email sent: ' + info.response);
       }
         });  
       }
       else
       {
           res.send("Failure!");
       }             
    } 
    })   
});

app.post('/change-pin-confirm', (req, res) => {
    
let otpSub = req.body.otp;
let otpCor = req.body.otpCorrect;
let id = req.body.id;
let newPin = req.body.newPin;

Customer.findOne({uniqueId: id}, function(err, foundCustomer)
{
    if(foundCustomer)
    {
       if(otpSub == otpCor)
        {
            Customer.findOneAndUpdate({ uniqueId: id }, { pin: newPin }, {new: true },function(err, response) { })
            res.render("pin-success");
        }
        

       else
        res.send("Wrong OTP");
    }
    else
      res.send("Not found");
  
})
});


app.listen(3000, () => {
    console.log('App now listening for requests on port 3000');
});

