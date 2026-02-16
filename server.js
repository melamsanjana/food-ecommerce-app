const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const db = require("./firebase");

const { collection, addDoc, getDocs, query, where } = require("firebase/firestore");



const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "foodsecret",
    resave: false,
    saveUninitialized: true
}));

// Set view engine
app.set("view engine", "ejs");

// Default route
// Default route
app.get("/", (req, res) => {
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.get("/cart", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const cart = req.session.cart || [];

    let total = 0;
    cart.forEach(item => {
        total += item.price;
    });

    res.render("cart", { cart, total });
});

app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if email already exists
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return res.send("Email already exists!");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user to Firestore
        await addDoc(collection(db, "users"), {
            name: name,
            email: email,
            password: hashedPassword
        });

        res.send("Signup successful! Go to login page.");

    } catch (error) {
        console.error(error);
        res.send("Error signing up");
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user with this email
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return res.send("User not found!");
        }

        let userData;
        querySnapshot.forEach((doc) => {
            userData = doc.data();
        });

        // Compare password
        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.send("Incorrect password!");
        }

        // Create session
        req.session.user = userData;

        res.redirect("/dashboard");

    } catch (error) {
        console.error(error);
        res.send("Error logging in");
    }
});

app.post("/add-to-cart", (req, res) => {
    const { id, name, price } = req.body;

    if (!req.session.cart) {
        req.session.cart = [];
    }

    req.session.cart.push({
        id,
        name,
        price: Number(price)
    });

    res.redirect("/dashboard");
});

app.get("/dashboard", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    try {
        // Fetch products
        const productsSnapshot = await getDocs(collection(db, "products"));
        let products = [];

        productsSnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });

        // Fetch orders for logged-in user
        const ordersQuery = query(
            collection(db, "orders"),
            where("userEmail", "==", req.session.user.email)
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        let orders = [];

        ordersSnapshot.forEach((doc) => {
            orders.push(doc.data());
        });

        res.render("dashboard", {
            user: req.session.user,
            products: products,
            orders: orders
        });

    } catch (error) {
        console.error(error);
        res.send("Error loading dashboard");
    }
});

app.post("/remove-from-cart", (req, res) => {
    const { index } = req.body;

    if (req.session.cart) {
        req.session.cart.splice(index, 1);
    }

    res.redirect("/cart");
});

app.post("/place-order", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.send("Cart is empty!");
    }

    let total = 0;
    cart.forEach(item => {
        total += item.price;
    });

    try {
        await addDoc(collection(db, "orders"), {
            userEmail: req.session.user.email,
            items: cart,
            totalAmount: total,
            date: new Date()
        });

        // Clear cart after order
        req.session.cart = [];

        res.send("Order placed successfully 🎉");

    } catch (error) {
        console.error(error);
        res.send("Error placing order");
    }
});

// Start server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
