// src/services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class Authservice {
  static async signUp(userData) {
    try {
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Check if user already exists
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      
      const userExists = users.find(user => 
        user.username === userData.username || user.email === userData.email
      );
      
      if (userExists) {
        throw new Error('User already exists');
      }

      // Add new user
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      
      // Auto-login after signup
      await this.login(userData.username, userData.password);
      
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async login(identifier, password) {
    try {
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      
      const user = users.find(user => 
        (user.username === identifier || user.email === identifier) && 
        user.password === password
      );
      
      if (user) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, user };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getCurrentUser() {
    try {
      const user = await AsyncStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  }

  static async logout() {
    try {
      await AsyncStorage.removeItem('currentUser');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default Authservice;