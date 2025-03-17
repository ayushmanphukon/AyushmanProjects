package com.package1.utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {
    private static final String URL = "jdbc:mysql://localhost:3306/instagram_clone";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "Ayush123";

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to load MySQL driver");
        }
    }

    public static Connection getConnection() throws SQLException {
        try {
            Connection conn = DriverManager.getConnection(URL, USERNAME, PASSWORD);
            if (conn == null) {
                throw new SQLException("Failed to establish database connection");
            }
            return conn;
        } catch (SQLException e) {
            System.err.println("Database Connection Error: " + e.getMessage());
            throw e;
        }
    }
}