package com.package5.profile;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.json.JSONArray;
import org.json.JSONObject;
import com.package1.utils.DatabaseConnection;

@WebServlet("/FetchUserTagsServlet")
public class FetchUserTagsServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String userId = request.getParameter("userId");
        PrintWriter out = response.getWriter();
        JSONArray tags = new JSONArray();
        response.setContentType("application/json");

        String query = "SELECT t.tag_id, t.tag FROM tags t JOIN user_tags ut ON t.tag_id = ut.tag_id WHERE ut.user_id = ?";
        
        try (Connection con = DatabaseConnection.getConnection(); 
             PreparedStatement pstmt = con.prepareStatement(query)) {
            pstmt.setInt(1, Integer.parseInt(userId));
            ResultSet rs = pstmt.executeQuery();
            while (rs.next()) {
                JSONObject jsonObject = new JSONObject()
                    .put("tag_id", rs.getInt("tag_id"))
                    .put("tag", rs.getString("tag"));
                tags.put(jsonObject);
            }
            out.println(tags);
            out.flush();
        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println(new JSONObject().put("error", "Database error").toString());
        }
    }
}