package com.package5.profile;

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

@WebServlet("/RemoveUserTagServlet")
public class RemoveUserTagServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String userId = request.getParameter("userId");
        String tagId = request.getParameter("tagId");
        PrintWriter out = response.getWriter();
        response.setContentType("application/json");

        String query = "DELETE FROM user_tags WHERE user_id = ? AND tag_id = ?";
        
        try (Connection con = DatabaseConnection.getConnection(); 
             PreparedStatement pstmt = con.prepareStatement(query)) {
            pstmt.setInt(1, Integer.parseInt(userId));
            pstmt.setInt(2, Integer.parseInt(tagId));
            int rowsAffected = pstmt.executeUpdate();
            if (rowsAffected > 0) {
                out.println(new JSONObject().put("success", true).toString());
            } else {
                out.println(new JSONObject().put("success", false).put("message", "Tag not found").toString());
            }
        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println(new JSONObject().put("success", false).put("message", "Database error").toString());
        } finally {
            out.flush();
        }
    }
}