const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const covidSchema = new Schema({

    email: String,
    name: String,
    contact: String,
    income: Number,
    hospital: String 	
    
});

const Covid = mongoose.model('covid', covidSchema);

module.exports = Covid;