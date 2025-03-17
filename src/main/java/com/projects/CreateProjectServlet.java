package com.projects;

import java.io.BufferedReader;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.package1.utils.DatabaseConnection;
import org.json.JSONObject;
import com.google.gson.JsonParser;
import com.mysql.cj.xdevapi.Statement;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

@WebServlet("/CreateProjectServlet")
public class CreateProjectServlet extends HttpServlet {


    private static final long serialVersionUID = 3084900604475185347L;

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        JSONObject jsonResponse = new JSONObject();

        try {
            BufferedReader reader = request.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            String requestBody = sb.toString();

            JsonObject jsonObject = JsonParser.parseString(requestBody).getAsJsonObject();
            String projectName = jsonObject.get("project_name").getAsString();
            String description = jsonObject.get("description").getAsString();
            String requirements = jsonObject.get("requirements").getAsString();
            int peopleRequired = jsonObject.get("people_required").getAsInt();
            JsonArray selectedTagsJson = jsonObject.getAsJsonArray("select_tags"); // Note: "select_tags" not "selected_tags"

            List<String> selectedTags = new ArrayList<>();
            if (selectedTagsJson != null) {
                for (JsonElement element : selectedTagsJson) {
                    selectedTags.add(element.getAsString());
                }
            }
            List<Integer> tagIds = getTagIdsByNames(selectedTags);

            HttpSession session = request.getSession(false);
            if (session == null || session.getAttribute("userId") == null) {
                jsonResponse.put("success", false);
                jsonResponse.put("error", "User not authenticated.");
                response.getWriter().write(jsonResponse.toString());
                return;
            }
            int userId = (int) session.getAttribute("userId");

            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "INSERT INTO projects (project_name, description, created_by, people_required, requirements) VALUES (?, ?, ?, ?, ?)";
                try (PreparedStatement stmt = conn.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS)) {
                    stmt.setString(1, projectName);
                    stmt.setString(2, description);
                    stmt.setInt(3, userId);
                    stmt.setInt(4, peopleRequired);
                    stmt.setString(5, requirements);

                    int rowsInserted = stmt.executeUpdate();
                    if (rowsInserted > 0) {
                        String projectId;
                        try (ResultSet rs = stmt.getGeneratedKeys()) {
                            if (rs.next()) {
                                projectId = rs.getString(1);
                            } else {
                                throw new SQLException("Failed to retrieve project ID.");
                            }
                        }

                        if (!tagIds.isEmpty()) {
                            String tagSql = "INSERT INTO project_tags (project_id, tag_id) VALUES (?, ?)";
                            try (PreparedStatement tagStmt = conn.prepareStatement(tagSql)) {
                                for (int tagId : tagIds) {
                                    tagStmt.setString(1, projectId);
                                    tagStmt.setInt(2, tagId);
                                    tagStmt.executeUpdate();
                                }
                            }
                        }

                        jsonResponse.put("success", true);
                        jsonResponse.put("message", "Project created successfully.");
                    } else {
                        jsonResponse.put("success", false);
                        jsonResponse.put("error", "Failed to insert project into database.");
                    }
                }
            } catch (Exception e) {
                jsonResponse.put("success", false);
                jsonResponse.put("error", "Database error: " + e.getMessage());
                e.printStackTrace();
            }
        } catch (Exception e) {
            jsonResponse.put("success", false);
            jsonResponse.put("error", "Invalid request data: " + e.getMessage());
            e.printStackTrace();
        }

        response.getWriter().write(jsonResponse.toString());
    }
	
	public  List<Integer> getTagIdsByNames(List<String> tagNames) {
        List<Integer> tagIds = new ArrayList<>();
        if (tagNames == null || tagNames.isEmpty()) {
            return tagIds;
        }

        String placeholders = String.join(",", tagNames.stream().map(t -> "?").toArray(String[]::new)); // ?,?,?
        String sql = "SELECT tag_id FROM tags WHERE tag IN (" + placeholders + ")";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            for (int i = 0; i < tagNames.size(); i++) {
                stmt.setString(i + 1, tagNames.get(i)); // Set tag names dynamically
            }

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    tagIds.add(rs.getInt("tag_id"));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return tagIds;
    }
}
