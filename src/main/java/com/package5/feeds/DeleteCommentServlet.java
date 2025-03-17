package com.package5.feeds;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.package1.utils.DatabaseConnection;
import com.package7.websocket.FeedsWebSocket;

/**
 * Servlet implementation class DeleteCommentServlet
 */
@WebServlet("/DeleteCommentServlet")
public class DeleteCommentServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("application/json");
		response.setCharacterEncoding("UTF-8");
		
		String commentId = request.getParameter("commentId");
		String userId = request.getParameter("userId");
		String postId = request.getParameter("postId");
		JSONObject jsonResponse = new JSONObject();
		PrintWriter out = response.getWriter();
		
		try(Connection con =  DatabaseConnection.getConnection()){
			String query = "delete from post_comments where comment_id = ? ;";
			try(PreparedStatement pstmt = con.prepareStatement(query)){
				pstmt.setString(1, commentId);
				int rowsAffected = pstmt.executeUpdate();
				
				if(rowsAffected > 0) {
					query = "update posts set comments_count = comments_count -1 where post_id = ? ;";
					try(PreparedStatement pstmt2 = con.prepareStatement(query)){
						pstmt2.setString(1, postId);
						
						rowsAffected = pstmt2.executeUpdate();
						
						if(rowsAffected > 0) {
							jsonResponse.put("success", true);
							jsonResponse.put("comment_id", commentId);
							jsonResponse.put("user_id", userId);
							
							out.println(jsonResponse.toString());
							out.flush();
							
							FeedsWebSocket.broadcast("comment_delete", jsonResponse);
						}
					}
				}
			}
		}catch(Exception e) {
			jsonResponse.put("success", false);
			out.println(jsonResponse);
			out.flush();
			System.out.println(e.getMessage());
		}
	}

}
