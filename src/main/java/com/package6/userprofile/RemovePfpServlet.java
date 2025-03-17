package com.package6.userprofile;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;


import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.package1.utils.DatabaseConnection;
import com.package7.websocket.FeedsWebSocket;

/**
 * Servlet implementation class RemovePfpServlet
 */
@WebServlet("/RemovePfpServlet")
public class RemovePfpServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
    
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		
		
		JSONObject jsonResponse = new JSONObject();
		PrintWriter out = response.getWriter();
		String userId = request.getParameter("userId");

        String query = "UPDATE users SET profile_picture_url = 'images/default-profile.jpg' WHERE user_id = ?";


        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
        	stmt.setString(1, userId);
        	int rowsAffected = stmt.executeUpdate();
        	
        	if(rowsAffected > 0) {
        		jsonResponse.put("success", true);
        		jsonResponse.put("userId", userId);
        		jsonResponse.put("profilePictureUrl", "images/default-profile.jpg" );
        		out.println(jsonResponse.toString());
        		System.out.println("RemovePfpServlet Called");
        		FeedsWebSocket.broadcast("profile_update", jsonResponse );
        	}
           
        } catch (SQLException e) {
			jsonResponse.put("success", false);
			out.println(jsonResponse.toString());
			e.printStackTrace();
		}
	}

}
