const router = require('express').Router();
const passport = require('passport');

router.get('/login', (req, res) => {
    res.render('login', { user: req.user });
});


router.get('/logout', (req, res) => {
    
    // Handle with passport
    req.logout();
    res.redirect('/home');
});


router.get('/google', passport.authenticate('google', {
    scope: ['profile']
}));


router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
   
    res.redirect('/profile/');

});

module.exports = router;