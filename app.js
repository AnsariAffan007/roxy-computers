const express = require('express');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect('mongodb://localhost:27017/roxyDB');
mongoose.connect(process.env.MONGO_URI);

const adminSchema = new mongoose.Schema({
    username: String,
    // role: String,
    password: String
});
const userSchema = new mongoose.Schema({
    companyName: String,
    name: String,
    address: String,
    email: String,
    contactNo: String,
    problemTitle: String,
    problemDesc: String,
    dateOfReport: String,
})
adminSchema.plugin(passportLocalMongoose);

const Admin = new mongoose.model("Admin", adminSchema);
const User = new mongoose.model("User", userSchema);

passport.use(Admin.createStrategy());

passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

app.get("/", function (req, res) {
    res.render("home", { success: false, danger: false });
})

app.get("/admin-login", function (req, res) {
    res.render("admin_login");
})

app.post("/admin-login", function (req, res) {

    // Admin.register(admin, req.body.password, function (err, user) {
    //     if (!err) {
    //         passport.authenticate("local")(req, res, function () {
    //             console.log("Admin Added!");;
    //         });
    //     }
    //     else {
    //         console.log(err);
    //     }
    // })

    const admin = new Admin({
        username: req.body.username,
        // role: "ROLE.ADMIN"
        password: req.body.password
    })

    req.login(admin, function (err) {
        if (!err) {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/admin-dashboard");
            })
        }
        else {
            console.log(err);
        }
    })
})

app.get("/admin-dashboard", async function (req, res) {
    if (req.isAuthenticated()) {
        let foundAdmin = await Admin.findOne({ username: req.user.username }).exec();
        if (foundAdmin) {
            let issues = await User.find({});
            res.render("admin", { adminName: foundAdmin.username, issues: issues });
        }
    }
    else {
        res.send("<h1>Admin Login Required!</h1>");
    }
})

app.get("/issue/:userName", async function (req, res) {
    if (req.isAuthenticated()) {
        let foundAdmin = await Admin.findOne({ username: req.user.username }).exec();
        if (foundAdmin) {
            let user = await User.findOne({ name: req.params.userName });
            if (user) {
                res.render("report", { adminName: foundAdmin.username, issue: user });
            }
        }
        else {
            res.send("<h1>Admin Login Required!</h1>");
        }
    }
    else {
        res.send("<h1>Admin Login Required!</h1>");
    }
})

app.post("/delete/:username", async function (req, res) {
    if (req.isAuthenticated()) {
        let foundAdmin = await Admin.findOne({ username: req.user.username }).exec();
        if (foundAdmin) {
            let heh = await User.deleteOne({ name: req.params.username });
            res.redirect("/admin-dashboard");
        }
    }
    else {
        res.send("<h1>Admin Login Required!</h1>");
    }
})

app.get("/admin-logout", function (req, res) {
    req.logout(function (error) {
        if (error) {
            console.log(error);
        }
        else {
            res.redirect("/admin-login");
        }
    });
})

app.get("/report-problem", function (req, res) {
    res.render("issue-form");
})

app.post("/report-problem", async function (req, res) {
    // console.log(req.body);
    let foundUser = await User.findOne({ name: req.body.userName }).exec();
    if (!foundUser) {
        await User.create({
            companyName: req.body.companyName,
            name: req.body.userName,
            address: req.body.address,
            email: req.body.email,
            contactNo: req.body.contactNumber,
            problemTitle: req.body.problemTitle,
            problemDesc: req.body.problemDescription,
            dateOfReport: new Date(req.body.dateOfReport).toDateString()
        });
        res.render("home", { success: true, danger: false });
    }
    else {
        res.render("home", { success: false, danger: true })
    }
})

app.listen(3000, function () {
    console.log("App running on port 3000");
})