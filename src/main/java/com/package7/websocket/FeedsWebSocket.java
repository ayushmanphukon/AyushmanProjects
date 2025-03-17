package com.package7.websocket;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.json.JSONObject;

@ServerEndpoint("/websocket/feeds")
public class FeedsWebSocket {
    private static final Set<Session> sessions = ConcurrentHashMap.newKeySet();
    
    @OnOpen
    public void onOpen(Session session) {
        sessions.add(session);
    }
    
    @OnClose
    public void onClose(Session session) {
        sessions.remove(session);
    }
    
    @OnError
    public void onError(Session session, Throwable throwable) {
        sessions.remove(session);
        throwable.printStackTrace();
    }
    
    @OnMessage
    public void onMessage(String message, Session session) {
        // Handle incoming messages if needed
    }
    
    public static void broadcast(String type, Object data) throws IOException {
        JSONObject message = new JSONObject()
            .put("type", type)
            .put("data", data);

        System.out.println("broadcastCalled!");

        String messageStr = message.toString();

        for (Session session : sessions) {
            session.getBasicRemote().sendText(messageStr);
        }
    }

} 