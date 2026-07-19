CREATE DATABASE IF NOT EXISTS forixa;
USE forixa;
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS marketers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    ref_code VARCHAR(100) UNIQUE NOT NULL,
    visitors INT DEFAULT 0,
    sales INT DEFAULT 0,
    points INT DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    project_description TEXT,
    platform TEXT,
    design TEXT,
    requirements TEXT,
    marketer_id INT,
    status ENUM(
        'new',
        'contacted',
        'waiting_payment',
        'paid',
        'in_progress',
        'completed',
        'cancelled'
    ) DEFAULT 'new',

    price DECIMAL(10,2) DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (marketer_id) REFERENCES marketers(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
);