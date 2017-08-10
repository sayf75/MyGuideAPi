var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var hash = require('password-hash');
var mysql = require('mysql');
var formidable = require('formidable');
var fs = require('fs');
var pool = mysql.createPool({
    host: 'mysql-morraycage.alwaysdata.net',
    user: '141511',
    password: 'naruto75',
    database: 'morraycage_myguide',
    connectionLimit: 10,
    multipleStatements: true
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Count length object
Object.size = function (obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

app.get('/', function (req, res) {
    return res.status(200).send('My guide root API');
});

app.listen(process.env.PORT || 8080, function () {
    console.log('Node app is running');
});

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
});

// Connexion
app.get('/users/:username/:password', function (req, res) {
    var usersList = {};
    var username = req.params.username;
    var password = req.params.password;

    if (username == '' || password == '')
        return res.sendStatus(400);
    pool.getConnection(function (err, conn) {
        if (err) return res.sendStatus(400);

        conn.query("SELECT * FROM users", function (err, results, fields) {
            if (err) throw err;
            for (var i in results) {
                usersList[i] = {
                    "username": results[i].username,
                    "password": results[i].password
                };
            }
            var size = Object.size(usersList);
            for (var i = 0; i < size; i++)
                if (usersList[i].username == username && hash.verify(password, usersList[i].password))
                    return res.status(200).send(results[i]);
            return res.sendStatus(400);
        });
    });
});

 //Get information depuis l'id
 app.get('/users/:id', function (req, res) {
     var id = req.params.id;

     if (id == '')
         return res.sendStatus(400);
     pool.getConnection(function (err, conn) {
         if (err) return res.sendStatus(400);

         conn.query("SELECT * FROM users WHERE id = ?", id, function (err, results, fields) {
             if (err) throw err;
             var data = {
                 id: results[0].id,
                 type: results[0].type,
                 nom: results[0].nom,
                prenom: results[0].prenom,
                 username: results[0].username,
                 email: results[0].email,
                 pays: results[0].pays,
                 ville: results[0].ville,
                 adresse: results[0].adresse,
                 postal: results[0].postal,
                 bourse: results[0].bourse,
                 disponibilite: results[0].disponibilite
             }
             return res.status(200).send(data);
         });
     });
 });


// Get les guides
app.get('/guides', function (req, res) {
    var type = req.params.type;
    
    if (type == '')
        return res.sendStatus(400);
    pool.getConnection(function (err, conn) {
        if (err) return res.sendStatus(400);

        conn.query("SELECT * FROM users WHERE type = 'guide'", type, function (err, results, fields) {
            if (err) throw err;
            return res.status(200).send(results);
        });
    });
});


// Inscription rapide
app.post('/users/:username/:password/:email', function (req, res) {
    var data = {
        type: "client",
        nom: "",
        prenom: "",
        username: req.params.username,
        password: hash.generate(req.params.password),
        email: req.params.email,
        pays: "",
        ville: "",
        adresse: "",
        postal: "",
        bourse: 100,
        disponibilite: 0
    };

    if (data.username == "" || data.email == "" || data.password == "")
        return res.sendStatus(400);
    pool.getConnection(function (err, conn) {
        if (err) throw err

        conn.query("SELECT * FROM users WHERE username = ?", data.username, function (err, results, fields) {
            if (Object.keys(results).length === 0) {
                conn.query("SELECT * FROM users WHERE email = ?", data.email, function (err, results, fields) {
                    if (Object.keys(results).length === 0) {
                        conn.query("INSERT INTO users SET ?", data, function (err, results, fields) {
                            return res.send({
                                status: 200
                            });
                        });
                    }
                });
            }
        });
    });
});

// Update info perso
app.put('/users/:id/:nom/:prenom/:email/:pays/:ville/:adresse/:postal', function (req, res) {
    var id = req.params.id;
    var data = {
        nom: req.params.nom,
        prenom: req.params.prenom,
        email: req.params.email,
        pays: req.params.pays,
        ville: req.params.ville,
        adresse: req.params.adresse,
        postal: req.params.postal
    };

    pool.getConnection(function (err, conn) {
        if (err) return res.sendStatus(400);

        conn.query("UPDATE users SET ? WHERE id = ?", [data, id], function (err, results, fields) {
            if (err) throw err;
            return res.sendStatus(200);
        });
    });
});

// Permet de switch entre guide et client
app.put('/type/:id/:type', function (req, res) {
    var id = req.params.id;
    var type = req.params.type;

    pool.getConnection(function (err, conn) {
        if (err) return res.sendStatus(400);

        conn.query("UPDATE users SET type = ? WHERE id = ?", [type, id], function (err, results, fields) {
            if (err) throw err;
            return res.sendStatus(200);
        });
    });
});

app.put('/disponibilite/:id/:disponibilite', function (req, res) {
    var id = req.params.id;
    var dispo = req.params.disponibilite;

    pool.getConnection(function (err, conn) {
        if (err) return res.sendStatus(400);

        conn.query("UPDATE users SET disponibilite = ? WHERE id = ?", [dispo, id], function (err, results, fields) {
            if (err) throw err;
            return res.sendStatus(200);
        });
    });
});

app.put('/bourse/:id/:bourse', function (req, res) {
    var id = req.params.id;
    var amount = req.params.bourse;

    if (amount == "")
        return res.sendStatus(400);
    pool.getConnection(function (err, conn) {
        if (err) return res.sendStatus(400);

        conn.query("UPDATE users SET bourse = ? WHERE id = ?", [amount, id], function (err, results, fields) {
            if (err) throw err;
            return res.status(200).send({
                status: 200
            });
        })
    })
});

// all other requests redirect to 404
app.all("*", function (req, res, next) {
    return res.send('page not found');
    next();
});
