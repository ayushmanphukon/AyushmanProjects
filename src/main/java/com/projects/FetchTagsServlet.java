package com.projects;

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

@WebServlet("/FetchTagsServlet")
public class FetchTagsServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String alike = request.getParameter("input");
        boolean isRandom = Boolean.parseBoolean(request.getParameter("isRandom"));
        PrintWriter out = response.getWriter();
        
        JSONArray tags = new JSONArray();
        response.setContentType("application/json");
        String query = "SELECT tag_id, tag FROM tags WHERE tag LIKE ?;";
        if (isRandom) {
            query = "SELECT tag_id, tag FROM tags ORDER BY RAND() LIMIT 5;";
        }

        try (Connection con = DatabaseConnection.getConnection(); 
             PreparedStatement pstmt = con.prepareStatement(query)) {
            if (!isRandom) {
                String temp = "%" + alike.trim() + "%";
                pstmt.setString(1, temp);
            }
            
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