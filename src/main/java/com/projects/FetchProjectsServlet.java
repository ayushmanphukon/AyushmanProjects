package com.projects;

import java.io.IOException;
import java.sql.*;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.package1.utils.DatabaseConnection;
import org.json.JSONArray;
import org.json.JSONObject;

@WebServlet("/FetchProjectsServlet")
public class FetchProjectsServlet extends HttpServlet {
    private static final long serialVersionUID = -731234223843685260L;

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        boolean isSearching = Boolean.parseBoolean(request.getParameter("isSearching"));
        String alike = request.getParameter("alike");
        String tag = request.getParameter("tag");

        if ("null".equals(tag)) {
            tag = null;
        }

        try (Connection conn = DatabaseConnection.getConnection()) {
            String sql;
            PreparedStatement stmt;

            if (tag != null) {
                sql = "SELECT p.project_id, p.project_name, p.description, p.people_required, p.created_at, p.requirements , " +
                      "u.username AS creator_name, u.profile_picture_url AS creator_profile_picture, " +
                      "GROUP_CONCAT(DISTINCT t.tag ORDER BY t.tag ASC) AS tags " +
                      "FROM projects p " +
                      "LEFT JOIN users u ON p.created_by = u.user_id " +
                      "JOIN project_tags pt ON p.project_id = pt.project_id " +
                      "JOIN tags t ON pt.tag_id = t.tag_id " +
                      "WHERE t.tag = ? " +
                      "GROUP BY p.project_id, p.project_name, p.description, p.people_required, p.created_at, u.username, u.profile_picture_url " +
                      "ORDER BY p.created_at DESC;";
                stmt = conn.prepareStatement(sql);
                stmt.setString(1, tag);
            } else if (isSearching) {
                sql = "SELECT p.project_id, p.project_name, p.description, p.people_required, p.created_at, p.requirements ," +
                      "u.username AS creator_name, u.profile_picture_url AS creator_profile_picture, " +
                      "GROUP_CONCAT(DISTINCT t.tag ORDER BY t.tag ASC) AS tags " +
                      "FROM projects p " +
                      "LEFT JOIN users u ON p.created_by = u.user_id " +
                      "LEFT JOIN project_tags pt ON p.project_id = pt.project_id " +
                      "LEFT JOIN tags t ON pt.tag_id = t.tag_id " +
                      "WHERE p.project_name LIKE ? " +
                      "GROUP BY p.project_id, p.project_name, p.description, p.people_required, p.created_at, u.username, u.profile_picture_url " +
                      "ORDER BY p.created_at DESC;";
                stmt = conn.prepareStatement(sql);
                stmt.setString(1, "%" + alike + "%");
            } else {
                sql = "SELECT p.project_id, p.project_name, p.description, p.people_required, p.created_at, p.requirements ," +
                      "u.username AS creator_name, u.profile_picture_url AS creator_profile_picture, " +
                      "GROUP_CONCAT(DISTINCT t.tag ORDER BY t.tag ASC) AS tags " +
                      "FROM projects p " +
                      "LEFT JOIN users u ON p.created_by = u.user_id " +
                      "LEFT JOIN project_tags pt ON p.project_id = pt.project_id " +
                      "LEFT JOIN tags t ON pt.tag_id = t.tag_id " +
                      "GROUP BY p.project_id, p.project_name, p.description, p.people_required, p.created_at, u.username, u.profile_picture_url " +
                      "ORDER BY p.created_at DESC;";
                stmt = conn.prepareStatement(sql);
            }

            try (ResultSet rs = stmt.executeQuery()) {
                JSONArray projectsArray = new JSONArray();
                java.util.LinkedHashMap<Integer, JSONObject> projectOrder = new java.util.LinkedHashMap<>();

                while (rs.next()) {
                    int projectId = rs.getInt("project_id");

                    JSONObject project = new JSONObject();
                    project.put("project_id", projectId);
                    project.put("project_name", rs.getString("project_name"));
                    project.put("description", rs.getString("description"));
                    project.put("requirements", rs.getString("requirements"));
                    project.put("people_required", rs.getInt("people_required"));
                    project.put("created_at", rs.getTimestamp("created_at").toString());
                    project.put("creator_username", rs.getString("creator_name"));
                    project.put("creator_profile_picture", rs.getString("creator_profile_picture"));

                    // Store tags as an array
                    String tagsString = rs.getString("tags");
                    if (tagsString != null) {
                        project.put("tags", tagsString.split(","));
                    } else {
                        project.put("tags", new String[0]);
                    }

                    // Get members separately
                    project.put("members", getProjectMembers(conn, projectId));

                    projectOrder.put(projectId, project);
                }

                for (JSONObject project : projectOrder.values()) {
                    projectsArray.put(project);
                }

                response.setContentType("application/json");
                response.getWriter().write(projectsArray.toString());
            }

        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Database error occurred\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unexpected error occurred\"}");
        }
    }

    private JSONArray getProjectMembers(Connection conn, int projectId) throws SQLException {
        String sql = "SELECT pm.user_id AS member_id, mu.username AS member_username, mu.profile_picture_url AS member_profile_picture " +
                     "FROM project_members pm " +
                     "LEFT JOIN users mu ON pm.user_id = mu.user_id " +
                     "WHERE pm.project_id = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, projectId);
            try (ResultSet rs = stmt.executeQuery()) {
                JSONArray membersArray = new JSONArray();
                while (rs.next()) {
                    JSONObject member = new JSONObject();
                    member.put("id", rs.getInt("member_id"));
                    member.put("username", rs.getString("member_username"));
                    member.put("profile_picture_url", rs.getString("member_profile_picture"));
                    membersArray.put(member);
                }
                return membersArray;
            }
        }
    }
}
