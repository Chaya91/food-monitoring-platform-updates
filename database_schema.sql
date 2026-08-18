CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (
        role IN (
            'Consumer',
            'Retail Manager',
            'Warehouse Operator',
            'Food Quality Inspector',
            'Administrator'
        )
    ),
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE predictions (
    prediction_id SERIAL PRIMARY KEY,
    image_id INT NOT NULL,
    food_category VARCHAR(100) NOT NULL,
    freshness_status VARCHAR(20) NOT NULL CHECK (
        freshness_status IN (
            'Fresh',
            'Good',
            'Acceptable',
            'Near Spoilage',
            'Spoiled',
            'Unknown'
        )
    ),
    confidence DECIMAL(5,2) NOT NULL,
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prediction_image
        FOREIGN KEY (image_id)
        REFERENCES food_images(image_id)
        ON DELETE CASCADE
);