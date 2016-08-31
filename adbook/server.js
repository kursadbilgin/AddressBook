var http = require('http'),
    express = require('express'),
    app = express(),
    bodyParser = require('body-parser');
    sqlite3 = require('sqlite3').verbose(),
    engines = require('consolidate'),
    path = require('path'),
    db = new sqlite3.Database('address');

app.engine('html', engines.mustache);
app.set('views', __dirname + '/public');
app.set('view engine', 'html');
app.use('/static', express.static(path.join(__dirname, 'static')));



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='addressbook'", function(err, row) {
    if(err !== null) {
        console.log(err);
    }
    else if(row == null) {
        db.run('CREATE TABLE "addressbook" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" VARCHAR(255), address VARCHAR(255))', function(err) {
            if(err !== null) {
                console.log(err);
            }
            else {
                console.log("SQL Table 'addressbook' initialized.");
            }
        });
    }
    else {
        console.log("SQL Table 'addressbook' already initialized.");
    }
});

app.get('/', function(req, res) {

    db.all('SELECT * FROM addressbook ORDER BY id', function(err, row) {
        if(err !== null) {
            res.send(500, "An error has occurred -- " + err);
        }
        else {
            res.render('index.html', {addressbook: row}, function(err, html) {
                res.send(200, html);
            });
        }
    });
});;

app.post('/add', function(req, res) {
    name = req.body.name;
    address = req.body.address;
    sqlRequest = "INSERT INTO 'addressbook' (name, address) VALUES('" + name + "', '" + address + "')"
    db.run(sqlRequest, function(err) {
        if(err !== null) {
            res.send(500, "An error has occurred -- " + err);
        }
        else {
            res.redirect('back');
        }
    });
});

app.get('/delete/:id', function(req, res, next) {
    db.run("DELETE FROM addressbook WHERE id='" + req.params.id + "'", function(err) {
        if(err !== null) {
            res.send(500, "An error has occurred -- " + err);
        }
        else {
            res.redirect('back')
        }
    });
});

app.get('/update/:id', function(req, res) {

    db.all("SELECT * FROM addressbook WHERE id = '" + req.params.id +"'", function(err, row) {
        if(err !== null) {
            res.send(500, "An error has occurred -- " + err);
        }
        else {
            res.render('update.html', {addressbook: row, person: row[0]}, function(err, html) {
                res.send(200, html);
            });
        }
    });
});

app.post('/update/:id', function (req, res) {

  db.run("UPDATE addressbook SET name = ?, address = ?  WHERE id = ?; ", req.body.name, req.body.address, req.params.id, function (err) {
    if(err !== null) {
      res.send(500, "An error has occurred --" + err);
    }
    else {
      console.log("Update");
    }
    res.redirect("/");
  });
});

db.serialize(function () {
  db.run("CREATE TABLE IF NOT EXISTS addressbook (name TEXT, address TEXT)");
});

app.get('/api', function (req, res) {
    db.all('SELECT * FROM addressbook ORDER BY id', function(err, row){
    res.json({ "person" : row});
  });
});

app.post('/api', function (req, res) {
  db.run("UPDATE addressbook SET name = ?, address = ? WHERE id = ?", req.body.name, req.body.address, req.params.id, function (err) {
    if(err){
      console.error(err);
      res.status(500);
    }
    else {
      res.status(202);
    }
    res.end();
  });
});


var port = process.env.PORT || 3000;
var host = process.env.HOST || "127.0.0.1";

var server = http.createServer(app).listen(port, host, function() {
    console.log("Server listening to %s:%d within %s environment",
                host, port, app.get('env'));
});
