import express from "express";
import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

/* ============================================================
   PATH SETUP
============================================================ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectFolder = path.join(__dirname, "..");
const databasePath = path.join(__dirname, "bison.db");

/* ============================================================
   DATABASE
============================================================ */

const db = new Database(databasePath);

console.log("SQLite database connected.");

/* ============================================================
   MIDDLEWARE
============================================================ */

app.use(express.json());

app.use(
    express.static(
        path.join(projectFolder, "public")
    )
);

/* ============================================================
   CREATE TABLES
============================================================ */

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        quality TEXT,
        rating REAL DEFAULT 5,
        reviews INTEGER DEFAULT 0,
        stock TEXT DEFAULT 'In Stock',
        description TEXT,
        sizes TEXT,
        colors TEXT,
        icon TEXT DEFAULT '👕',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_address TEXT NOT NULL,
        customer_city TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT NOT NULL
    );
`);

console.log("Database tables ready.");

/* ============================================================
   DEFAULT PRODUCTS
============================================================ */

const productCount = db
    .prepare("SELECT COUNT(*) AS count FROM products")
    .get();

if (productCount.count === 0) {

    const insertProduct = db.prepare(`
        INSERT INTO products (
            name,
            category,
            price,
            quantity,
            quality,
            rating,
            reviews,
            stock,
            description,
            sizes,
            colors,
            icon
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultProducts = [

        [
            "Classic Black T-Shirt",
            "Men T-Shirts",
            1499,
            25,
            "Premium Cotton",
            4.8,
            126,
            "In Stock",
            "Premium comfortable black t-shirt made for everyday wear.",
            "S,M,L,XL",
            "Black,White,Grey",
            "👕"
        ],

        [
            "Premium Casual Shirt",
            "Men Shirts",
            2499,
            18,
            "Premium Fabric",
            4.7,
            94,
            "In Stock",
            "Stylish premium casual shirt suitable for everyday and smart casual looks.",
            "M,L,XL,XXL",
            "White,Blue,Black",
            "👔"
        ],

        [
            "Classic Blue Jeans",
            "Men Jeans",
            3299,
            32,
            "Premium Denim",
            4.9,
            218,
            "In Stock",
            "Classic blue denim jeans with a comfortable modern fit.",
            "30,32,34,36,38",
            "Blue,Black",
            "👖"
        ],

        [
            "Smart Fit Trousers",
            "Men Trousers",
            2799,
            14,
            "High Quality",
            4.6,
            82,
            "In Stock",
            "Comfortable smart trousers for office and formal occasions.",
            "30,32,34,36,38",
            "Black,Grey,Navy",
            "🩳"
        ],

        [
            "Kids Casual T-Shirt",
            "Boys T-Shirts",
            999,
            40,
            "Premium Cotton",
            4.8,
            73,
            "In Stock",
            "Comfortable casual t-shirt designed especially for boys.",
            "6Y,8Y,10Y,12Y,14Y",
            "Red,Blue,Black",
            "👕"
        ],

        [
            "Boys Casual Shirt",
            "Boys Shirts",
            1499,
            22,
            "High Quality",
            4.7,
            61,
            "In Stock",
            "Smart and comfortable casual shirt for boys.",
            "6Y,8Y,10Y,12Y,14Y",
            "White,Blue,Green",
            "👔"
        ],

        [
            "Boys Denim Jeans",
            "Boys Jeans",
            1999,
            17,
            "Premium Denim",
            4.8,
            107,
            "In Stock",
            "Durable and comfortable denim jeans for boys.",
            "6Y,8Y,10Y,12Y,14Y",
            "Blue,Black",
            "👖"
        ],

        [
            "Classic Casual Jacket",
            "Men Jackets",
            4499,
            9,
            "Premium Quality",
            4.9,
            154,
            "In Stock",
            "Modern casual jacket with a clean and stylish look.",
            "M,L,XL,XXL",
            "Black,Brown,Navy",
            "🧥"
        ]

    ];

    const insertMany = db.transaction((items) => {

        for (const product of items) {
            insertProduct.run(...product);
        }

    });

    insertMany(defaultProducts);

    console.log("Default BISON products added.");
}

/* ============================================================
   ADMIN AUTHENTICATION
============================================================ */

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "BISON123";

/* ============================================================
   CREATE ADMIN SESSION
============================================================ */

function createSession() {

    const token = crypto
        .randomBytes(32)
        .toString("hex");

    const expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    db.prepare(`
        INSERT INTO admin_sessions (
            token,
            expires_at
        )
        VALUES (?, ?)
    `).run(
        token,
        expiresAt
    );

    return {
        token,
        expiresAt
    };
}

/* ============================================================
   READ COOKIES
============================================================ */

function getCookies(req) {

    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
        return {};
    }

    const cookies = {};

    cookieHeader
        .split(";")
        .forEach(cookie => {

            const index = cookie.indexOf("=");

            if (index === -1) {
                return;
            }

            const name =
                cookie.substring(0, index).trim();

            const value =
                cookie.substring(index + 1).trim();

            cookies[name] =
                decodeURIComponent(value);

        });

    return cookies;
}

/* ============================================================
   CHECK ADMIN SESSION
============================================================ */

function isAdminAuthenticated(req) {

    const cookies = getCookies(req);

    const token =
        cookies.bison_admin_session;

    if (!token) {
        return false;
    }

    const session = db
        .prepare(`
            SELECT *
            FROM admin_sessions
            WHERE token = ?
        `)
        .get(token);

    if (!session) {
        return false;
    }

    if (
        new Date(session.expires_at).getTime()
        < Date.now()
    ) {

        db.prepare(`
            DELETE FROM admin_sessions
            WHERE token = ?
        `).run(token);

        return false;
    }

    return true;
}

/* ============================================================
   ADMIN PROTECTION
============================================================ */

function requireAdmin(req, res, next) {

    if (!isAdminAuthenticated(req)) {

        return res.status(401).json({
            error: "Admin login required."
        });

    }

    next();
}

/* ============================================================
   CLEAN EXPIRED SESSIONS
============================================================ */

db.prepare(`
    DELETE FROM admin_sessions
    WHERE expires_at < ?
`).run(
    new Date().toISOString()
);

/* ============================================================
   ADMIN LOGIN
============================================================ */

app.post(
    "/api/admin/login",
    (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;

            if (
                username !== ADMIN_USERNAME ||
                password !== ADMIN_PASSWORD
            ) {

                return res.status(401).json({
                    error:
                        "Invalid username or password."
                });

            }

            const session =
                createSession();

            res.setHeader(
                "Set-Cookie",
                `bison_admin_session=${encodeURIComponent(session.token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`
            );

            res.json({
                success: true,
                message:
                    "Admin login successful."
            });

        } catch (error) {

            console.error(
                "ADMIN LOGIN ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not login."
            });
        }

    }
);

/* ============================================================
   ADMIN CHECK
============================================================ */

app.get(
    "/api/admin/me",
    (req, res) => {

        if (!isAdminAuthenticated(req)) {

            return res.status(401).json({
                authenticated: false
            });

        }

        res.json({
            authenticated: true
        });

    }
);

/* ============================================================
   ADMIN LOGOUT
============================================================ */

app.post(
    "/api/admin/logout",
    (req, res) => {

        try {

            const cookies =
                getCookies(req);

            const token =
                cookies.bison_admin_session;

            if (token) {

                db.prepare(`
                    DELETE FROM admin_sessions
                    WHERE token = ?
                `).run(token);

            }

            res.setHeader(
                "Set-Cookie",
                "bison_admin_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
            );

            res.json({
                success: true,
                message:
                    "Logged out successfully."
            });

        } catch (error) {

            console.error(
                "ADMIN LOGOUT ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not logout."
            });
        }

    }
);

/* ============================================================
   HOME PAGE
============================================================ */

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                projectFolder,
                "public",
                "index.html"
            )
        );

    }
);

/* ============================================================
   HEALTH CHECK
============================================================ */

app.get(
    "/api/health",
    (req, res) => {

        res.json({
            success: true,
            message:
                "BISON Backend is running!",
            database:
                "SQLite connected",
            time:
                new Date().toISOString()
        });

    }
);

/* ============================================================
   GET ALL PRODUCTS
============================================================ */

app.get(
    "/api/products",
    (req, res) => {

        try {

            const products = db
                .prepare(`
                    SELECT *
                    FROM products
                    ORDER BY id DESC
                `)
                .all();

            const formattedProducts =
                products.map(product => ({

                    ...product,

                    sizes:
                        product.sizes
                            ? product.sizes
                                .split(",")
                                .map(item =>
                                    item.trim()
                                )
                            : [],

                    colors:
                        product.colors
                            ? product.colors
                                .split(",")
                                .map(item =>
                                    item.trim()
                                )
                            : []

                }));

            res.json(formattedProducts);

        } catch (error) {

            console.error(
                "GET PRODUCTS ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not load products."
            });
        }

    }
);

/* ============================================================
   GET ONE PRODUCT
============================================================ */

app.get(
    "/api/products/:id",
    (req, res) => {

        try {

            const product = db
                .prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `)
                .get(req.params.id);

            if (!product) {

                return res.status(404).json({
                    error:
                        "Product not found."
                });

            }

            product.sizes =
                product.sizes
                    ? product.sizes
                        .split(",")
                        .map(item =>
                            item.trim()
                        )
                    : [];

            product.colors =
                product.colors
                    ? product.colors
                        .split(",")
                        .map(item =>
                            item.trim()
                        )
                    : [];

            res.json(product);

        } catch (error) {

            console.error(
                "GET PRODUCT ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not load product."
            });
        }

    }
);

/* ============================================================
   ADD PRODUCT
   ADMIN ONLY
============================================================ */

app.post(
    "/api/products",
    requireAdmin,
    (req, res) => {

        try {

            const {
                name,
                category,
                price,
                quantity,
                quality,
                rating,
                description,
                sizes,
                colors,
                icon,
                stock
            } = req.body;

            if (
                !name ||
                !category ||
                price === undefined ||
                quantity === undefined
            ) {

                return res.status(400).json({
                    error:
                        "Please provide product name, category, price and quantity."
                });

            }

            const result = db
                .prepare(`
                    INSERT INTO products (
                        name,
                        category,
                        price,
                        quantity,
                        quality,
                        rating,
                        reviews,
                        stock,
                        description,
                        sizes,
                        colors,
                        icon
                    )
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
                `)
                .run(

                    name.trim(),

                    category,

                    Number(price),

                    Number(quantity),

                    quality || "",

                    Number(rating) || 5,

                    stock || "In Stock",

                    description || "",

                    Array.isArray(sizes)
                        ? sizes.join(",")
                        : (sizes || ""),

                    Array.isArray(colors)
                        ? colors.join(",")
                        : (colors || ""),

                    icon || "👕"

                );

            const newProduct = db
                .prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `)
                .get(
                    result.lastInsertRowid
                );

            res.status(201).json({

                message:
                    "Product added successfully!",

                product:
                    newProduct

            });

        } catch (error) {

            console.error(
                "ADD PRODUCT ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not add product."
            });
        }

    }
);

/* ============================================================
   UPDATE PRODUCT
   ADMIN ONLY
============================================================ */

app.put(
    "/api/products/:id",
    requireAdmin,
    (req, res) => {

        try {

            const {
                name,
                category,
                price,
                quantity,
                quality,
                rating,
                description,
                sizes,
                colors,
                icon,
                stock
            } = req.body;

            const existingProduct = db
                .prepare(`
                    SELECT id
                    FROM products
                    WHERE id = ?
                `)
                .get(req.params.id);

            if (!existingProduct) {

                return res.status(404).json({
                    error:
                        "Product not found."
                });

            }

            if (
                !name ||
                !category ||
                price === undefined ||
                quantity === undefined
            ) {

                return res.status(400).json({
                    error:
                        "Please provide product name, category, price and quantity."
                });

            }

            db.prepare(`
                UPDATE products
                SET
                    name = ?,
                    category = ?,
                    price = ?,
                    quantity = ?,
                    quality = ?,
                    rating = ?,
                    stock = ?,
                    description = ?,
                    sizes = ?,
                    colors = ?,
                    icon = ?
                WHERE id = ?
            `).run(

                name.trim(),

                category,

                Number(price),

                Number(quantity),

                quality || "",

                Number(rating) || 5,

                stock || "In Stock",

                description || "",

                Array.isArray(sizes)
                    ? sizes.join(",")
                    : (sizes || ""),

                Array.isArray(colors)
                    ? colors.join(",")
                    : (colors || ""),

                icon || "👕",

                req.params.id

            );

            const updatedProduct = db
                .prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `)
                .get(req.params.id);

            res.json({

                message:
                    "Product updated successfully!",

                product:
                    updatedProduct

            });

        } catch (error) {

            console.error(
                "UPDATE PRODUCT ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not update product."
            });
        }

    }
);

/* ============================================================
   DELETE PRODUCT
   ADMIN ONLY
============================================================ */

app.delete(
    "/api/products/:id",
    requireAdmin,
    (req, res) => {

        try {

            const result = db
                .prepare(`
                    DELETE FROM products
                    WHERE id = ?
                `)
                .run(req.params.id);

            if (result.changes === 0) {

                return res.status(404).json({
                    error:
                        "Product not found."
                });

            }

            res.json({
                message:
                    "Product deleted successfully!"
            });

        } catch (error) {

            console.error(
                "DELETE PRODUCT ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not delete product."
            });
        }

    }
);

/* ============================================================
   CREATE ORDER
   PUBLIC
============================================================ */

app.post(
    "/api/orders",
    (req, res) => {

        try {

            const {
                customer_name,
                customer_phone,
                customer_address,
                customer_city,
                items
            } = req.body;

            /* Validate customer details */

            if (
                !customer_name ||
                !customer_phone ||
                !customer_address ||
                !customer_city ||
                !Array.isArray(items) ||
                items.length === 0
            ) {

                return res.status(400).json({
                    error:
                        "Please complete all order details."
                });

            }

            let total = 0;

            const preparedItems = [];

            /* Check every cart item */

            for (const item of items) {

                const product = db
                    .prepare(`
                        SELECT *
                        FROM products
                        WHERE id = ?
                    `)
                    .get(item.product_id);

                if (!product) {

                    return res.status(400).json({
                        error:
                            `Product ID ${item.product_id} was not found.`
                    });

                }

                const quantity =
                    Number(item.quantity);

                if (
                    !Number.isInteger(quantity) ||
                    quantity <= 0
                ) {

                    return res.status(400).json({
                        error:
                            "Invalid product quantity."
                    });

                }

                if (
                    product.quantity < quantity
                ) {

                    return res.status(400).json({
                        error:
                            `${product.name} does not have enough stock.`
                    });

                }

                total +=
                    product.price * quantity;

                preparedItems.push({
                    product,
                    quantity
                });

            }

            /* Generate order number */

            const orderNumber =
                "BISON-" +
                Date.now() +
                "-" +
                Math.floor(
                    Math.random() * 1000
                );

            /* ====================================================
               DATABASE TRANSACTION
            ==================================================== */

            const createOrder =
                db.transaction(() => {

                    const orderResult =
                        db.prepare(`
                            INSERT INTO orders (
                                order_number,
                                customer_name,
                                customer_phone,
                                customer_address,
                                customer_city,
                                total,
                                status
                            )
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `)
                        .run(

                            orderNumber,

                            customer_name.trim(),

                            customer_phone.trim(),

                            customer_address.trim(),

                            customer_city.trim(),

                            total,

                            "Pending"

                        );

                    const orderId =
                        orderResult.lastInsertRowid;

                    const insertItem =
                        db.prepare(`
                            INSERT INTO order_items (
                                order_id,
                                product_id,
                                product_name,
                                price,
                                quantity
                            )
                            VALUES (?, ?, ?, ?, ?)
                        `);

                    const updateStock =
                        db.prepare(`
                            UPDATE products
                            SET quantity = quantity - ?
                            WHERE id = ?
                        `);

                    for (
                        const item
                        of preparedItems
                    ) {

                        insertItem.run(

                            orderId,

                            item.product.id,

                            item.product.name,

                            item.product.price,

                            item.quantity

                        );

                        updateStock.run(

                            item.quantity,

                            item.product.id

                        );

                    }

                    return orderId;

                });

            const orderId =
                createOrder();

            /* Send success response */

            res.status(201).json({

                message:
                    "Order placed successfully!",

                orderId,

                orderNumber,

                total

            });

        } catch (error) {

            console.error(
                "CREATE ORDER ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not place order."
            });
        }

    }
);

/* ============================================================
   CUSTOMER ORDER TRACKING
   PUBLIC
============================================================ */

/*
    Customer can track an order using:

    Order Number
    +
    Phone Number

    Example:

    /api/track-order?order_number=BISON-123456789-123&phone=03001234567

    IMPORTANT:
    We do NOT return the customer's full address
    or other sensitive admin-only information.
*/

app.get(
    "/api/track-order",
    (req, res) => {

        try {

            const orderNumber =
                String(
                    req.query.order_number || ""
                ).trim();

            const phone =
                String(
                    req.query.phone || ""
                ).trim();

            if (
                !orderNumber ||
                !phone
            ) {

                return res.status(400).json({
                    error:
                        "Please enter your order number and phone number."
                });

            }

            const order = db
                .prepare(`
                    SELECT
                        id,
                        order_number,
                        customer_name,
                        customer_phone,
                        customer_city,
                        total,
                        status,
                        created_at
                    FROM orders
                    WHERE order_number = ?
                      AND customer_phone = ?
                `)
                .get(
                    orderNumber,
                    phone
                );

            if (!order) {

                return res.status(404).json({
                    error:
                        "Order not found. Please check your order number and phone number."
                });

            }

            const items = db
                .prepare(`
                    SELECT
                        product_name,
                        price,
                        quantity
                    FROM order_items
                    WHERE order_id = ?
                `)
                .all(order.id);

            res.json({

                success: true,

                order: {
                    ...order,
                    items
                }

            });

        } catch (error) {

            console.error(
                "TRACK ORDER ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not track order."
            });

        }

    }
);

/* ============================================================
   GET ALL ORDERS
   ADMIN ONLY
============================================================ */

app.get(
    "/api/orders",
    requireAdmin,
    (req, res) => {

        try {

            const orders = db
                .prepare(`
                    SELECT *
                    FROM orders
                    ORDER BY id DESC
                `)
                .all();

            const getItems =
                db.prepare(`
                    SELECT
                        id,
                        product_id,
                        product_name,
                        price,
                        quantity
                    FROM order_items
                    WHERE order_id = ?
                `);

            const formattedOrders =
                orders.map(order => ({

                    ...order,

                    items:
                        getItems.all(order.id)

                }));

            res.json(formattedOrders);

        } catch (error) {

            console.error(
                "GET ORDERS ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not load orders."
            });
        }

    }
);

/* ============================================================
   GET ONE ORDER
   ADMIN ONLY
============================================================ */

app.get(
    "/api/orders/:id",
    requireAdmin,
    (req, res) => {

        try {

            const order = db
                .prepare(`
                    SELECT *
                    FROM orders
                    WHERE id = ?
                `)
                .get(req.params.id);

            if (!order) {

                return res.status(404).json({
                    error:
                        "Order not found."
                });

            }

            const items = db
                .prepare(`
                    SELECT
                        id,
                        product_id,
                        product_name,
                        price,
                        quantity
                    FROM order_items
                    WHERE order_id = ?
                `)
                .all(order.id);

            res.json({
                ...order,
                items
            });

        } catch (error) {

            console.error(
                "GET ORDER ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not load order."
            });
        }

    }
);

/* ============================================================
   UPDATE ORDER STATUS
   ADMIN ONLY
============================================================ */

app.put(
    "/api/orders/:id/status",
    requireAdmin,
    (req, res) => {

        try {

            const { status } =
                req.body;

            const allowedStatuses = [
                "Pending",
                "Confirmed",
                "Shipped",
                "Delivered",
                "Cancelled"
            ];

            if (
                !allowedStatuses.includes(status)
            ) {

                return res.status(400).json({
                    error:
                        "Invalid order status."
                });

            }

            const result = db
                .prepare(`
                    UPDATE orders
                    SET status = ?
                    WHERE id = ?
                `)
                .run(
                    status,
                    req.params.id
                );

            if (result.changes === 0) {

                return res.status(404).json({
                    error:
                        "Order not found."
                });

            }

            res.json({
                message:
                    "Order status updated successfully!"
            });

        } catch (error) {

            console.error(
                "UPDATE ORDER STATUS ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not update order status."
            });
        }

    }
);

/* ============================================================
   DATABASE STATS
   ADMIN ONLY
============================================================ */

app.get(
    "/api/stats",
    requireAdmin,
    (req, res) => {

        try {

            const products = db
                .prepare(`
                    SELECT COUNT(*) AS count
                    FROM products
                `)
                .get();

            const orders = db
                .prepare(`
                    SELECT COUNT(*) AS count
                    FROM orders
                `)
                .get();

            const pendingOrders = db
                .prepare(`
                    SELECT COUNT(*) AS count
                    FROM orders
                    WHERE status = 'Pending'
                `)
                .get();

            const revenue = db
                .prepare(`
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS total
                    FROM orders
                    WHERE status != 'Cancelled'
                `)
                .get();

            res.json({

                products:
                    products.count,

                orders:
                    orders.count,

                pendingOrders:
                    pendingOrders.count,

                revenue:
                    revenue.total

            });

        } catch (error) {

            console.error(
                "STATS ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Could not load statistics."
            });
        }

    }
);

/* ============================================================
   404 API HANDLER
============================================================ */

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({
            error:
                "API endpoint not found."
        });

    }
);

/* ============================================================
   START SERVER
============================================================ */

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "================================="
        );

        console.log(
            "BISON BACKEND IS RUNNING"
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            "================================="
        );

    }
);