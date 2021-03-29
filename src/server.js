const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')

const dotenv = require('dotenv')
const path = require("path")

const http = require('http')

const router = express.Router()
const app = express()

/*
 * --------------------------
 * Express Server Config
 * --------------------------
 */
dotenv.config()
const PORT = process.env.SERVER_PORT || 5250

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  //console.log("++++ SERVERLOG :", req.protocol + '://' + req.get('host') + req.originalUrl)
  next()
})

app.use(bodyParser.urlencoded({ extended: true }))

app.disable('x-powered-by')

app.use('/public', express.static(path.join(__dirname, 'public')))

app.use("/", router)

app.use(cookieParser())

app.use(session({
    name: 'scp',
    key: 'scp',
    secret: 'secret1',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}))

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
  if (req.cookies.scp && !req.session.user) {
      res.clearCookie('scp')        
  }
  next()
})

http.createServer(app).listen(PORT, () => {
  console.log("NodeJS HTTP Express Server started ==> PORT: ", PORT)
})

// middleware function to check for logged-in users
let sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.scp) {
      res.redirect('/dashboard')
  } else {
      next()
  }    
}

/*
 * -------------------------------
 * ROUTES
 * -------------------------------
 */

// route for Home-Page
app.get('/', sessionChecker, (req, res) => {
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`REDIRECT VISITOR[ ${ip} ]...`);
  res.redirect('/login')
})

// route for user Login
app.route('/login')
  .get(sessionChecker, (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`LOGIN PAGE, VISITOR[ ${ip} ]...`);
    res.sendFile(__dirname + '/public/login.html')
  })
  .post((req, res) => {    
    let username = req.body.username
    let password = req.body.password

    const t_username = process.env.T_USERNAME
    const t_password = process.env.T_PASSWORD

    if( (username == t_username) && (password == t_password) ) {
      
      let cdate = Math.random()
      req.session.user = `User Payload RND: ${cdate}`

      console.log("Okay, successfully logged in.", req.session)

      res.redirect('/dashboard')
    } else {
      res.redirect('/failed')
    }
  })


// route for user's dashboard
app.get('/dashboard', (req, res) => {
  if (req.session.user && req.cookies.scp) {
    res.sendFile(__dirname + '/public/dashboard.html')
  } else {
    res.redirect('/failed')
  }
})

// route for failed login
app.get('/failed', (req, res) => {
  res.sendFile(__dirname + '/public/failed.html')
})

// route for user logout
app.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.scp) {
    res.clearCookie('scp')
    res.redirect('/')
  } else {
    res.redirect('/login')
  }
})

// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
  res.status(404).send("Page not found.")
})