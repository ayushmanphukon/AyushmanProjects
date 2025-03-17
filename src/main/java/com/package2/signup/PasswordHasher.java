package com.package2.signup;

import org.mindrot.jbcrypt.BCrypt;

public class PasswordHasher {

    // Hash a password securely
    public static String hashPassword(String password) {
        return BCrypt.hashpw(password, BCrypt.gensalt(12));  // 12 rounds of salting
    }

    // Verify a password against the stored hash
    public static boolean verifyPassword(String password, String storedHash) {
        return BCrypt.checkpw(password, storedHash);
    }
}
