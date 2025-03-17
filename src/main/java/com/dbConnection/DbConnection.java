package com.dbConnection;

import javax.servlet.ServletContextListener;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DbConnection implements ServletContextListener{
	
	private static Connection connection = null;
	private DbConnection() {
		
	}

	    public static Connection connectDb(){
	    	if(connection == null) {
	    		String url = "jdbc:mysql://localhost:3306/instagram_clone";
	    		String userName = "Maha";
	    		String passWord = "Maha@2024";
	    		try {
	                Class.forName("com.mysql.cj.jdbc.Driver");
	                connection = DriverManager.getConnection( url, userName, passWord);
				} catch (SQLException e) {
					System.out.println("sql exception");
					// TODO Auto-generated catch block
					e.printStackTrace();
				} catch (ClassNotFoundException e) {
					// TODO Auto-generated catch block
					System.out.println("driver not found");
					e.printStackTrace();
				}
	    	}
	        return connection;
	    }
	}

