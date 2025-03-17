package com.chatApplication;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.json.JSONArray;
//import org.json.JSONObject;
import org.json.JSONObject;

import com.dbConnection.UserManager;


@WebServlet("/ContactsData")
public class ContactsData extends HttpServlet {
	private static final long serialVersionUID = 1L;
       

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    	response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
		HttpSession session = request.getSession();
		int userId = Integer.parseInt(session.getAttribute("userId").toString());
		JSONObject responseObject = new JSONObject();
		JSONArray contacts = UserManager.getAllUsers(userId);
		JSONObject currentUser = UserManager.getUser(userId);
		responseObject.put("contacts", contacts);
		responseObject.put("currentUser", currentUser);
		response.getWriter().write(responseObject.toString());
	}

	
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}

}
