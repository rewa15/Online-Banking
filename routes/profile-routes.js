const router = require('express').Router();
const Customer = require('../models/customer-model');

const authCheck = (req, res, next) => {
	
    if(!req.user)
    {
        res.redirect('/auth/login');
    }

    else 
    {
        next();
    }
};

router.get('/', authCheck, (req, res) => {

const uniqueId = req.user.googleId;
Customer.findOne({uniqueId: uniqueId}, function(err, foundCustomer)
{      

        if(foundCustomer)
        {
             res.render("welcome-page", { user: req.user.googleId, result: true});  
        }                        
        
        else
        {
             res.render("welcome-page", { user: req.user.googleId, result: false});
        }
    
})

});

module.exports = router;