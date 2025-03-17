package com.package4.search;

import com.package1.utils.DatabaseConnection;

import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class SearchServlet extends HttpServlet {

    private static final long serialVersionUID = 371349241677817117L;

	@Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET");

        String query = request.getParameter("q");
        System.out.println("Search query received: " + query);

        if (query == null || query.trim().isEmpty()) {
            response.getWriter().write(new JSONObject().put("users", new JSONArray()).toString());
            return;
        }

        try (Connection conn = DatabaseConnection.getConnection()) {
            String sql = "SELECT user_id, username, full_name, profile_picture_url FROM users " +
                    "WHERE username LIKE ? OR full_name LIKE ? LIMIT 10";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                String searchPattern = "%" + query.trim() + "%";
                stmt.setString(1, searchPattern);
                stmt.setString(2, searchPattern);

                ResultSet rs = stmt.executeQuery();
                JSONArray users = new JSONArray();

                while (rs.next()) {
                    JSONObject user = new JSONObject()
                        .put("userId", rs.getInt("user_id"))
                        .put("username", rs.getString("username"))
                        .put("fullName", rs.getString("full_name"))
                        .put("profilePictureUrl", rs.getString("profile_picture_url"));
                    users.put(user);
                }

                JSONObject response_data = new JSONObject().put("users", users);
                response.getWriter().write(response_data.toString());
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JSONObject errorResponse = new JSONObject()
                .put("error", "Failed to search users")
                .put("message", e.getMessage());
            response.getWriter().write(errorResponse.toString());
        }
    }
}