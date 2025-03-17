package com.chatApplication;

import java.io.BufferedReader;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.websocket.Session;

import org.json.JSONArray;
import org.json.JSONObject;

import com.dbConnection.MessagesManager;


@WebServlet("/GetMessages")
public class MessageDisplayer extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession session = request.getSession();
		int userId = Integer.parseInt(session.getAttribute("userId").toString());
		
		StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        JSONObject jsonObject = new JSONObject(sb.toString());
        
        int senderId = jsonObject.getInt("receiverId");
		JSONArray oldMessages= MessagesManager.getMessages(userId,senderId);
		response.getWriter().write(oldMessages.toString());
	}


	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		doGet(request, response);
	}
	
//	private void DisplayUnreadMessages(int userId,Session session) {
//        JSONArray unreadMessages = MessagesManager.getUnreadMessages(userId);
//        unreadMessages.forEach(object -> {
//        	JSONObject message  = (JSONObject) object;
//        	int senderId = Integer.parseInt(message.getString("senderId")); 
//        	String content = message.getString("message");
//        	session.getAsyncRemote().sendText(content);
//        	MessagesManager.setRead(senderId,userId);
//        });
//    }

}
