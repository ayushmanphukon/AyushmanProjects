package com.chatApplication;

import java.io.BufferedReader;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.dbConnection.UserManager;


@WebServlet("/getNewChat")
public class NewChat extends HttpServlet {
	private static final long serialVersionUID = 1L;
  
//	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
//		response.getWriter().append("Served at: ").append(request.getContextPath());
//	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        JSONObject jsonObject = new JSONObject(sb.toString());
        
        int receiverId = jsonObject.getInt("receiverId");
        JSONObject user =  UserManager.getUser(receiverId);
        response.getWriter().write(user.toString());
//		doGet(request, response);
	}

}
