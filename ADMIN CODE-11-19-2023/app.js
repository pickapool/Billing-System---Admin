const express = require('express');
const path = require('path');
const bodyParser = require('body-parser')
const hbs = require('express-handlebars');
const cookieParser = require('cookie-parser')
const admin = require("firebase-admin");
const csrf = require("csurf");
const date = require('date-and-time')
const sdk = require('api')('@paymongo/v2#ks50we2lllywnb4r');
var session = require('express-session')
var https = require('follow-redirects').https;
var fs = require('fs');

var smsOptions = {
  'method': 'POST',
  'hostname': 'lqzrwr.api.infobip.com',
  'path': '/sms/3/messages',
  'headers': {
      'Authorization': 'App 7a0f5405efea215df18b32abd5f90740-b047d23a-2996-464f-9fde-00f36483edb7',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
  },
  'maxRedirects': 20
};
// Student API
//lqzrwr.api.infobip.com
// 7a0f5405efea215df18b32abd5f90740-b047d23a-2996-464f-9fde-00f36483edb7

//Developer
//qy9v43.api.infobip.com
//1a621fb80ded49f8dd1bd90d55487983-6b99cb8b-dd70-43e0-bc68-a867da45307d


//firebase
var serviceAccount = require("./serviceAccountKey.json");
const { Console } = require('console');
const { request } = require('http');
const { response } = require('express');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://billing-system-86a33-default-rtdb.firebaseio.com",
  storageBucket: "billing-system-86a33.appspot.com"
});

const app = express();
//Set View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  helpers: {
    eq: (v1, v2) => v1 === v2,
    empty: (v1) => v1 === String.empty,
    null: (v1) => v1 === null,
    undefined: (v1) => v1 === undefined
  },
  extname: 'hbs',
  defaultLayout: 'mainLayout.hbs',
  layoutsDir: __dirname + '/views/layouts/'
}));

//End view engine

//Init
const database = admin.database();
const auth = admin.auth();
const csrfMiddleware = csrf({ cookie: true });

const payments = database.ref('/Payment_ID');
const complaints = database.ref('/Complaints');
const userAccount = database.ref('/UserAccounts');
const staffAccount = database.ref('/staffAccounts');
const announcement = database.ref('/Announcements');
const bills = database.ref('/Bills');

app.use(express.static(__dirname + '/views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}));
const options = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true
};

var sessions;

app.get('/', (request, response) => {
  if (sessions)
    response.render('User', { isLogin: false, isUser: "active", staffs: staffs(), access: sessions.access });
  else
    response.render('Login', { isLogin: true, isUser: "active" });
});
app.get('/Client/List', (request, response) => {
  if (sessions)
    response.render('ClientList', { accounts: accounts(), isLogin: false, isClient: "active", access: sessions.access });
  else
    response.render('Login', { isLogin: true, isUser: "active" });
});
app.get('/User', (request, response) => {
  if (sessions)
    response.render('User', { isLogin: false, isUser: "active", staffs: staffs(), access: sessions.access });
  else
    response.render('Login', { isLogin: true, isUser: "active" });
});
app.get('/Client', (request, response) => {
  if (sessions)
    response.render('Client', { isLogin: false, isClient: "active", users: userCount(), clients: usersAccountsCount(), payments: JSON.stringify(paymentId()), access: sessions.access });
  else
    response.render('Login', { isLogin: true, isUser: "active" });
});
app.get('/Transaction', (request, response) => {
  if (sessions)
    response.render('Transaction', { isLogin: false, isTransaction: "active", payments: JSON.stringify(paymentId()), access: sessions.access });
  else
    response.render('Login', { isLogin: true, isUser: "active" });
});
app.get('/Complaints', (request, response) => {
  if (sessions)
    response.render('Complaints', { isLogin: false, isComplaint: "active", complaints: listComplaints(), access: sessions.access });
  else
    response.render('Login', { isLogin: true, isUser: "active" });
});
app.get('/Announcement', (request, response) => {
  if (sessions)
    response.render('Announcement', { isLogin: false, isAnnouncement: "active", announcements: listAnnouncement(), access: sessions.access });
  else
    response.render('Login', { isLogin: true, isUser: "active" });
});
app.get('/Archives', (request, response) => {
  if (sessions)
    response.render('Archive', { isLogin: false, archive: archives(), access: sessions.access });
  else
    response.render('Login', { isLogin: true, isUser: "active" });
});
app.post('/login', (request, response) => {
  var username = request.body.username;
  var password = request.body.password;
  sessions = request.session;
  var st = staffs();
  staffAccount.orderByChild("username").equalTo(username).on('value', (snapshot) => {
    if (snapshot.exists()) {
      snapshot.forEach((data) => {
        var value = data.val();
        if (password == value.password) {
          if (value.active == false) {
            response.render('User', { isLogin: true, isUser: "active", message: "Account has ben deactivated.", access: sessions.access });
          } else {
            sessions.uid = value.key;
            sessions.access = value.access;
            response.render('User', { isLogin: false, isUser: "active", staffs: st, access: value.access });
          }
        } else {
          response.render('Login', { isLogin: true, message: 'Password is invalid.' })
        }
      })
    } else {
      response.render('Login', { isLogin: true, message: "Sorry we can't find your account." })
    }
  })
})
let userCount = () => {
  return staffs().length;
}
let usersAccountsCount = () => {
  return usersAccounts().length;
}
let listAnnouncement = () => {
  let a = [];
  announcement.on('value', (snapshot) => {
    snapshot.forEach((data) => {
      var value = data.val();
      a.push(value);
    })
  })
  return a;
}
let staffs = () => {
  let s = [];
  staffAccount.on('value', (snapshot) => {
    snapshot.forEach((data) => {
      var value = data.val();
      if (value.username != "admin") {
        s.push(value);
      }
    })
  })
  return s;
}
let accounts = () => {
  let s = [];
  userAccount.on('value', (snapshot) => {
    snapshot.forEach((data) => {
      var value = data.val();
      
      if (value.IsArchive == "false" || value.IsArchive == false || value.IsArchive == undefined) {
        s.push(value);
      }
    })
  })
  return s;
}
let archives = () => {
  let s = [];
  userAccount.on('value', (snapshot) => {
    snapshot.forEach((data) => {
      var value = data.val();
      if (value.IsArchive == true) {
        s.push(value);
      }
    })
  })
  return s;
}
let listComplaints = () => {
  let c = [];
  complaints.on('value', (snapshot) => {
    snapshot.forEach((data) => {
      var value = data.val();
      if (value.accountNumber != "" && value.accountName != "")
        c.push(value);
    })
  })
  return c;
}
let paymentId = () => {
  let p = [];
  payments.on('value', (snapshot) => {
    snapshot.forEach((data) => {
      data.forEach((id) => {
        var current = id.val();
        p.push(current.paymentId);
      })
    })
  })
  return p;
}

let usersAccounts = () => {
  let u = [];
  userAccount.on('value', (snapshot) => {
    snapshot.forEach((data) => {
      var value = data.val();
      u.push(value);
    })
  })
  return u;
}
app.post("/saveUser", (request, response) => {
  var key = staffAccount.push().key;
  var user = {
    username: request.body.user,
    password: request.body.p,
    access: request.body.t,
    key: key,
    active: true
  }
  staffAccount.child(key).set(user).then(() => {
    response.render('User', { isLogin: false, staffs: staffs(), access: sessions.access })
  })
})
app.post("/saveAnnouncement", (request, response) => {
  var key = announcement.push().key;
  let date = new Date();
  let local = date.toLocaleDateString("en-PH", options);
  local = local.replace("at", "");
  var content = {
    title: request.body.t,
    message: request.body.m,
    date: local,
    key: key,
    active: true
  }
  announcement.child(key).set(content).then(() => {
    response.render('Announcement', { isLogin: false, announcements: listAnnouncement(), access: sessions.access })
  })
})
app.post('/deleteAnnouncement', (request, response) => {
  var key = request.body.key;
  announcement.child(key).remove().then(() => {
    response.render('Announcement', { isLogin: false, accounts: accounts(), access: sessions.access })
  })
})
app.post('/removeClient', (request, response) => {
  var uid = request.body.uid;
  // console.log(uid)
  userAccount.child(uid).remove().then(() => {
    response.redirect('/Client/list')
  })
})

app.post('/archive', (request, response) => {
  var uid = request.body.uid;

  var data = {
    uid : uid,
    accountNumber: request.body.ac?? "None",
    address: request.body.ad,
    email: request.body.email,
    loginType: request.body.lt,
    name: request.body.name,
    phoneNumber: request.body.pn,
    profile: request.body.p,
    IsArchive : true
  }
  userAccount.child(uid).update(data).then(() => {
    response.redirect('/Client/list')
  })
})

app.post('/restore', (request, response) => {
  var uid = request.body.uid;

  var data = {
    uid : uid,
    accountNumber: request.body.ac?? "None",
    address: request.body.ad,
    email: request.body.email,
    loginType: request.body.lt,
    name: request.body.name,
    phoneNumber: request.body.pn,
    profile: request.body.p,
    IsArchive : false
  }
  userAccount.child(uid).update(data).then(() => {
    response.redirect('/Client/list')
  })
})

app.post('/bill', (request, response) => {
  var key = staffAccount.push().key;
  var bill = {
    key : key,
    amount : request.body.amount,
    clientUid: request.body.uid,
    duedate: request.body.duedate,
    datefrom: request.body.datefrom,
    dateto: request.body.dateto,
    readingfrom: request.body.readingfrom,
    readingto: request.body.readingto,
    consumed: request.body.consumed,
    arrears: request.body.arrears,
    isPaid: false
  }
  bills.child(key).set(bill).then(() => {

    var smsRequest = https.request(smsOptions, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
          chunks.push(chunk);
      });

      res.on("end", function (chunk) {
          var body = Buffer.concat(chunks);
          console.log(body.toString());
      });

      res.on("error", function (error) {
          console.error(error);
      });
    });

    var postData = JSON.stringify({
          "messages": [
              {
                  "sender": "InfoSMS",
                  "destinations": [
                      {
                          "to": "639632294147"
                      }
                  ],
                  "content": {
                      "text": "Good day! You have new bill.\n\nAmount: "+request.body.amount+"\nDue Date:"+request.body.duedate+"\nReading:"+request.body.readingfrom+"-"+request.body.readingfrom+" \n\n-Tibiao Water Billing"
                  }
              }
          ]
      });
    smsRequest.write(postData);
    smsRequest.end();
    response.redirect('/Client/list')
  })
})


app.post("/deactivate", (request, response) => {
  var key = request.body.key;
  var active = request.body.active;
  var user;
  if (active == "true") {
    user = {
      active: false
    }
  } else {
    user = {
      active: true
    }
  }
  staffAccount.child(key).update(user).then(() => {
    response.render('User', { isLogin: false, staffs: staffs(), access: sessions.access })
  })
})

app.get("/Logout", (req, res) => {
  req.session.destroy();
  sessions = null;
  res.render('Login', { isLogin: true })
});

app.listen(5020, () => {
  console.log("App running on 5020");
});


