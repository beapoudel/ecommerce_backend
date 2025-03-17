const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors'); 

const app = express();
app.use(cors());

app.use(express.json());
const pool = require('./dbserver');

app.use('/uploads', express.static('uploads'));
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });


async function getAllProducts(searchQuery = "") {
    try {
        let sql = "SELECT * FROM product"; // Default query
        let params = [];

        if (searchQuery) {
            sql += " WHERE product LIKE ?";
            params.push(`%${searchQuery}%`);
        }

        const [rows] = await pool.query(sql, params);
        return rows;
    } catch (err) {
        console.error("Database error:", err.message);
        throw err;
    }
}

app.get('/product', async (req, res) => {
    try {
        const searchQuery = req.query.search || "";
        const products = await getAllProducts(searchQuery);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

    app.post("/save-message", (req, res) => {
        const { clientId, sender, message, isImage, phone } = req.body;
    
        if (!clientId || !sender || !message || !phone) {
            return res.status(400).json({ error: "❌ Missing required fields" });
        }
    
        const sql = "INSERT INTO messages (client_id, sender, message, isImage, phone, timestamp) VALUES (?, ?, ?, ?, ?, NOW())";
        pool.query(sql, [clientId, sender, message, isImage, phone], (err, result) => {
            if (err) {
                console.error("❌ Database Insert Error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            res.json({ success: true, message: "✅ Message saved successfully" });
        });
    });

app.post("/save-image-message", upload.single("image"), async (req, res) => {
    try {
        console.log("📥 Request received at /save-image-message"); 
        console.log("req.body:", req.body);
        console.log("req.file:", req.file);
        
        // Extract data from request body
        const { clientId, sender, phone } = req.body;
        
        if (!req.file) {
            console.error("❌ No file uploaded");
            return res.status(400).json({ error: "❌ No file uploaded" });
        }
        
        // Path to be stored in database (will be served from /upload URL)
        const image = `/uploads/${req.file.filename}`;
        console.log("📸 Image path to be stored:", image);

        // Validate required fields
        if (!clientId || !sender || !phone) {
            return res.status(400).json({ error: "❌ Missing required fields" });
        }

        // SQL query to insert the image message
        const sql = "INSERT INTO messages (client_id, sender, message, isImage, phone, timestamp) VALUES (?, ?, ?, ?, ?, NOW())";
        
        pool.query(sql, [clientId, sender, image, true, phone], (err, result) => {
            if (err) {
                console.error("❌ Database Insert Error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            console.log("✅ Image message saved successfully:", image);
            // Include a full URL for easy testing
            const fullImageUrl = `http://localhost:5000${image}`;
            console.log("Full image URL:", fullImageUrl);
            res.json({ 
                success: true, 
                message: "✅ Image message saved successfully", 
                imageUrl: image,
                fullImageUrl: fullImageUrl 
            });
        });
    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
});


app.get("/get-clients", async (req, res) => {
    try {
        const sql = `
            SELECT client_id, phone 
            FROM messages 
            GROUP BY client_id, phone 
            ORDER BY MAX(timestamp) DESC`; // Sort by most recent message

        const [results] = await pool.query(sql); // Use async/await with pool
        res.json(results);
    } catch (err) {
        console.error("❌ Database Query Error:", err.message, err.sqlMessage);
        res.status(500).json({ error: "Database error", details: err.sqlMessage });
    }
});

app.get("/get-messages", async (req, res) => {
    try {
        const { phone } = req.query;
        console.log("Fetching messages for phone:", phone);

        if (!phone) {
            return res.status(400).json({ error: "Missing phone parameter!" });
        }

        const sql = "SELECT sender, message, isImage FROM messages WHERE phone = ? ORDER BY timestamp ASC";
        const [messages] = await pool.query(sql, [phone]);
        
        console.log(`Found ${messages.length} messages for phone ${phone}`);
        
        // For debugging, log some sample messages
        if (messages.length > 0) {
            console.log("Sample message:", messages[0]);
        }

        res.json(messages);
    } catch (err) {
        console.error("❌ Database Query Error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

app.post('/products', upload.fields([{ name: 'image1' }, { name: 'image2' }]), async (req, res) => {
    try {
        const { product, price, sale, category, feature, description,banner } = req.body;
        const image1 = req.files['image1'] ? `/uploads/${req.files['image1'][0].filename}` : null;
        const image2 = req.files['image2'] ? `/uploads/${req.files['image2'][0].filename}` : null;

        if (!product || !price) {
            return res.status(400).json({ error: "Product name and price are required" });
        }
        if(sale ==="Yes" && feature ==="Yes"){

        const result = await pool.query(
            "INSERT INTO product (product, price, image, image2, isSale, category, Feature, description, Slider) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [product, price, image1, image2, true, category, true, description, banner]
        );
        res.status(201).json({ message: "Product added successfully", id: result.insertId });
    }
    if(sale ==="No" && feature ==="No"){

        const result = await pool.query(
            "INSERT INTO product (product, price, image, image2, isSale, category, Feature, description, Slider) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [product, price, image1, image2, false, category, false, description, banner]
        );
        res.status(201).json({ message: "Product added successfully", id: result.insertId });
    }
    if(sale ==="Yes" && feature ==="No"){

        const result = await pool.query(
            "INSERT INTO product (product, price, image, image2, isSale, category, Feature, description, Slider) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [product, price, image1, image2, true, category, false, description, banner]
        );
        res.status(201).json({ message: "Product added successfully", id: result.insertId });
    }

    if(sale ==="No" && feature ==="Yes"){

        const result = await pool.query(
            "INSERT INTO product (product, price, image, image2, isSale, category, Feature, description, Slider) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [product, price, image1, image2, false, category, true, description, banner]
        );
        res.status(201).json({ message: "Product added successfully", id: result.insertId });
    }

    } catch (err) {
        console.error("Database error:", err.message);
        res.status(500).json({ error: "Failed to insert product" });
    }
});

app.delete("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM product WHERE id = ?";
    
    pool.query(sql, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Failed to delete data" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "No record found with this ID" });
      }
      res.json({ message: "Data deleted successfully" });
    });
  });
  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`App is running ${PORT}`));

