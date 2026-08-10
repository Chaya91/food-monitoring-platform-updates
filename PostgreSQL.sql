CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (
        role IN ('Consumer', 'Retail Manager', 'Warehouse Operator', 'Food Quality Inspector', 'Administrator')
    ),
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users
(full_name, email, password_hash, role, phone)
VALUES
(
'Chaya',
'chaya@example.com',
'password123',
'Consumer',
'9876543210'
);

SELECT * FROM users;

CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    food_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (
        category IN (
            'Fruits',
            'Vegetables',
            'Dairy Products',
            'Meat & Poultry',
            'Seafood',
            'Bakery Products',
            'Packaged Foods',
            'Beverages'
        )
    ),
    batch_number VARCHAR(50),
    quantity INT NOT NULL,
    manufacture_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);
INSERT INTO inventory
(user_id, food_name, category, batch_number, quantity, manufacture_date, expiry_date)
VALUES
(
1,
'Apple',
'Fruits',
'B001',
50,
'2026-07-25',
'2026-08-10'
);

SELECT * FROM inventory;

CREATE TABLE food_images (
    image_id SERIAL PRIMARY KEY,
    inventory_id INT NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    image_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_image_inventory
        FOREIGN KEY (inventory_id)
        REFERENCES inventory(inventory_id)
        ON DELETE CASCADE
);

INSERT INTO food_images
(inventory_id, image_name, image_path)
VALUES
(
1,
'apple.jpg',
'uploads/apple.jpg'
);
SELECT * FROM food_images;

CREATE TABLE predictions (
    prediction_id SERIAL PRIMARY KEY,
    image_id INT NOT NULL,
    food_category VARCHAR(100) NOT NULL,
    freshness_status VARCHAR(20) NOT NULL CHECK (
        freshness_status IN ('Fresh', 'Good', 'Acceptable', 'Near Spoilage', 'Spoiled', 'Unknown')
    ),
    confidence DECIMAL(5,2) NOT NULL,
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prediction_image
        FOREIGN KEY (image_id)
        REFERENCES food_images(image_id)
        ON DELETE CASCADE
);
INSERT INTO predictions
(image_id, food_category, freshness_status, confidence)
VALUES
(2, 'Apple', 'Fresh', 54.59);

SELECT * FROM predictions;

INSERT INTO predictions
(image_id, food_category, freshness_status, confidence)
VALUES
(1, 'Apple', 'Fresh', 54.59);


SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'food_images';

INSERT INTO food_images (inventory_id, image_name, image_path)
VALUES
(1, 'apple.jpg', 'uploads/apple.jpg');

SELECT
    u.full_name,
    i.food_name,
    fi.image_name,
    p.food_category,
    p.freshness_status,
    p.confidence
FROM users u
JOIN inventory i
    ON u.user_id = i.user_id
JOIN food_images fi
    ON i.inventory_id = fi.inventory_id
JOIN predictions p
    ON fi.image_id = p.image_id;

SELECT * FROM predictions
ORDER BY prediction_id DESC;	
