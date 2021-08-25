const express = require('express');
const bodyparser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const {v4: uuid4} = require('uuid');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

const dataPath = "./db/fakedb.json";

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}))
app.use(express.static(__dirname))
app.use(multer({dest:"uploads"}).single("filedata"))


const getData = ()=> {
    let data = fs.readFileSync(dataPath);
    return JSON.parse(data)
}

const saveData = (data)=> {
    let stringifyData = JSON.stringify(data)
    fs.writeFileSync(dataPath, stringifyData)
}

app.post('/users/register', (req, res)=> {
    let data = getData();
    let id = uuid4();
    let password = req.body.password;

    if(password.length > 6) {
        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(password, salt, function(err, hash){
                if(!err) {
                    let obj = {
                        "id": id,
                        "username": req.body.username, 
                        "email": req.body.email,
                        "password": hash,
                        "token": ""
                    }

                    data['users'].push(obj);
                    saveData(data);
                    res.send("ok!!!")
                } else {
                    res.sendStatus(401)
                }
            });
        });
    }

})

app.post("/users/login", (req, res)=> {
    let data = getData();
    let token = uuid4();
    let email = data['users'].map((element) => {
        return element.email;
    })

    let obj = data['users'].find(element => {
        if(element.email == req.body.email) {
            return element;
        }
    })

    let index = data['users'].indexOf(obj)

    if(email.includes(req.body.email)) {
        // res.send(obj)
        bcrypt.compare(req.body.password, obj.password, function(err, result) {
            if(result) {
                data['users'][index]['token'] = token;
                saveData (data);
                setTimeout(function () {
                    data['users'][index]['token'] = "";
                    saveData(data);
                  }, 3600000);
                res.send("ok")
            } else {
                res.send("invalid password")
            }
        });
    } else {
        res.send("invalid email")
    }

})

app.post('/user/upload/:id', (req, res)=> {

    let data = getData();
    let id = uuid4();
    let authorId = req.params.id;

    if(token) {
        let filedata = req.file;
        let filename = filedata.originalname;
        let fileext = filename.split('.').pop();

        if (!fileext.match(/(jpg|jpeg|png|gif)$/i)) {
            return res.send("Upload file with right extension");
        } else {
            let filepath = filedata.path;
            let obj = {
                "id": id,
                "title": req.body.title, 
                "path": filepath,
                "authorID": authorId
            }
            data['photos'].push(obj);
            saveData(data);
            res.send("ok")
        }
    } else {
        res.send("Please log in")
    }


})

app.listen(8080, ()=> {
    console.log("server start")
})

