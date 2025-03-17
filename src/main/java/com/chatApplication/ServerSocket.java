package com.chatApplication;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import org.json.JSONArray;
import org.json.JSONObject;

import com.dbConnection.MessagesManager;
import com.dbConnection.UserManager;

@ServerEndpoint(value = "/connectServer", configurator = Configurator.class)
public class ServerSocket {

    @OnOpen
    public void onOpen(Session session) {
        int userId = Integer.parseInt(session.getUserProperties().get("userId").toString());
        WebSessionManager.addUserSession(userId, session);
        System.out.println("WebSocket opened for user: " + userId);
    }

    @OnMessage
    public void onMessage(String message, Session senderSession) {
        JSONObject jsonMessage = new JSONObject(message);
        System.out.println(jsonMessage);
        int senderId = jsonMessage.getInt("senderId");
        int receiverId = jsonMessage.optInt("receiverId", 0); // Use optInt to handle null safely
        int groupId = jsonMessage.optInt("groupId", 0); // Use optInt to handle null safely
        String content = jsonMessage.getString("content");

        if (groupId != 0) { // Group message
            JSONArray groupContacts = UserManager.getGroupContacts(groupId);
            
            for (int i = 0; i < groupContacts.length(); i++) {
                JSONObject groupContact = groupContacts.getJSONObject(i);
                int userId = groupContact.getInt("userId");
                Session receiverSession = WebSessionManager.getUserSession(userId);

                if (userId != senderId) {
                    if (receiverSession != null && receiverSession.isOpen()) {
                        receiverSession.getAsyncRemote().sendText(jsonMessage.toString());
                        MessagesManager.storeSendingMessage(senderId, userId, content, true, groupId);
                    } else {
                        System.out.println("Receiver session not found for user ID: " + userId);
                        MessagesManager.storeSendingMessage(senderId, userId, content, false, groupId);
                    }
                }
            }
        } else { // Personal message
            Session receiverSession = WebSessionManager.getUserSession(receiverId);

            if (receiverSession != null && receiverSession.isOpen()) {
                receiverSession.getAsyncRemote().sendText(jsonMessage.toString());
                MessagesManager.storeSendingMessage(senderId, receiverId, content, true, 0);
            } else {
                System.out.println("Receiver session not found for ID: " + receiverId);
                MessagesManager.storeSendingMessage(senderId, receiverId, content, false, 0); // Fixed call
            }
        }
    }

    @OnClose
    public void onClose(Session session) {
        int userId = Integer.parseInt(session.getUserProperties().get("userId").toString());
        if (userId != 0) {
            WebSessionManager.removeUserSession(userId);
            System.out.println("WebSocket closed for user: " + userId);
        } else {
            System.out.println("No userId found in session properties");
        }
    }
}