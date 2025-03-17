package com.package7.websocket;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.json.JSONObject;

@ServerEndpoint("/websocket/profiles")
public class ProfileWebSocket {
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
    
    public static void broadcast(String type, Object data) {
        JSONObject message = new JSONObject()
            .put("type", type)
            .put("data", data);
        
            
        String messageStr = message.toString();
        
        for (Session session : sessions) {
            try {
                session.getBasicRemote().sendText(messageStr);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
} 