const express = require('express');
const app = express();

require('./utils/db');
const Contact = require('./model/contact');

const { body, validationResult, check } = require('express-validator');
const e = require('express');

const methodOverride = require('method-override');

const port = process.env.PORT || 3000;

app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.static('asset'));
app.use(express.urlencoded({ extended: true }));

app.get('/', function(req, res) {
    res.render('index', { title: "index.html" });
})

// async karena menunggu sampai promise find selesai
app.get('/contact', async function(req, res) {
    const contacts = await Contact.Contact.find();

    res.render('contact', { title: "contact.html", contacts: contacts });
})

// add new contact
app.get('/contact/add', function(req, res) {
    res.render('add-contact', {
        title: "add-data.html",
        errors: undefined,
    })
})

// process add contact
app.post('/contact', [
    // check (param, error msg)
    body('email').custom( function(value) {
        if (value === undefined) return true;
        else return check('email', 'Email is not valid').isEmail()
    }),
    check('noHP', 'No HP is not valid').isMobilePhone('id-ID'), 
    body('noHP').custom( async function(value) {
        const dupli = await Contact.Contact.findOne({ noHP: value} );
        if (dupli) 
            throw new Error("No HP is already in the list");
        return true;
    } )
    ],
    function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render('add-contact', {
                title: "add-data.html",
                errors : errors.array(),
            })
        } else {
            Contact.Contact.insertMany(req.body);
            res.redirect('/contact');
        }
    }
)

// delete contact use params
// app.get('/contact/delete/:noHP', async function(req, res) {
//     const contacts = await Contact.Contact.findOne( {noHP: req.params.noHP });

//     if (!contacts) {
//         res.status(404);
//         res.send("<h1>No Such No HP</h1>");
//     } else {
//         Contact.Contact.deleteOne({ noHP: contacts.noHP })
//         .then((result) => { 
//             res.redirect('/contact'); 
//         });
        
//     }
// })

app.delete('/contact', function(req, res) {
    Contact.Contact.deleteOne({ noHP: req.body.noHP } )
    .then((result) => {
        res.redirect('/contact'); 
    })
})

app.get('/contact/edit/:noHP', async function(req, res) {
    const contacts = await Contact.Contact.findOne({ noHP: req.params.noHP} );
    if (contacts === undefined) {
        res.send("<h1>Not so Fast Ferguso</h1>")
    } else {
        res.render('edit-contact', {
            contacts: contacts,
            title: 'edit-contact.html',
            errors: undefined,
        })
    }
})

// edit data
app.put('/contact', [
    // check (param, error msg)
    body('email').custom( function(value) {
        if (value === undefined) return true;
        else return check('email', 'Email is not valid').isEmail()
    }),
    check('noHP', 'No HP is not valid').isMobilePhone('id-ID'), 
    body('noHP').custom( async function(value, { req }) {
        const dupli = await Contact.Contact.findOne({ noHP: value} );
        if (dupli && req.body.tmpKey !== value) 
            throw new Error("No HP is already in the list");
        return true;
    } )
    ],
    function(req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render('edit-contact', {
                title: "edit-data.html",
                contacts: req.body,
                errors : errors.array(),
            })
        } else {
            Contact.Contact.updateOne( 
                { noHP: req.body.tmpKey },
                {
                    $set: {
                        nama: req.body.nama,
                        email: req.body.email,
                        noHP: req.body.noHP,
                    }
                }
            )
            .then((result) => res.redirect('/contact'));
        }
    }
)

app.get('/contact/:noHP', async function(req, res) {
    const contacts = await Contact.Contact.findOne({ noHP: req.params.noHP });
    res.render('detail', { title: "detail.html", contacts: contacts });
})

app.use((req, res) => {
    res.status(404);
    res.send('<h1>Error: page not found</h1>');
})

app.listen(port, function() {
    console.log(`app listening port ${port}`);
})