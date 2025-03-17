package com.package2.signup;

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

import org.json.JSONArray;
import org.json.JSONObject;

import com.package1.utils.DatabaseConnection;

@WebServlet("/SubmitTagsServlet")
public class SubmitTagsServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();
        
        try {
            // Get user_id and tag_ids from request
            String userIdStr = request.getParameter("user_id");
            String tagIdsStr = request.getParameter("tag_ids"); // Expecting a JSON array string
            
            if (userIdStr == null || tagIdsStr == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.println(new JSONObject().put("success", false).put("message", "Missing user_id or tag_ids").toString());
                return;
            }

            int userId = Integer.parseInt(userIdStr);
            JSONArray tagIds = new JSONArray(tagIdsStr);

            // Insert into user_tags
            String query = "INSERT INTO user_tags (user_id, tag_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = user_id;";
            try (Connection con = DatabaseConnection.getConnection();
                 PreparedStatement pstmt = con.prepareStatement(query)) {
                
                con.setAutoCommit(false); // Use transaction for multiple inserts
                for (int i = 0; i < tagIds.length(); i++) {
                    int tagId = tagIds.getInt(i);
                    pstmt.setInt(1, userId);
                    pstmt.setInt(2, tagId);
                    pstmt.addBatch();
                }
                pstmt.executeBatch();
                con.commit();

                response.setStatus(HttpServletResponse.SC_OK);
                out.println(new JSONObject().put("success", true).put("message", "Tags saved successfully").toString());
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.println(new JSONObject().put("success", false).put("message", "Database error").toString());
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println(new JSONObject().put("success", false).put("message", "Server error").toString());
        } finally {
            out.flush();
        }
    }
}