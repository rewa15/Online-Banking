const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({

	uniqueId: String,
    email: String,
    password: String,
    income: Number,
    account: String,
    balance: Number,
    accountNo: String,
    address: String,
    contact: String,
    pin: Number,
    card: String,
    beneficiary: Array   	
    
});

const Customer = mongoose.model('customer', customerSchema);

module.exports = Customer;