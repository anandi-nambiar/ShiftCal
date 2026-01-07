// components/Auth.tsx
import React, { useState } from "react";
import { Button, TextInput, View, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../utils/supabase";
import { RootStackParamList } from "../navigation/types";

type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Auth">;

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation<AuthScreenNavigationProp>();

  /** Sign in existing user */
  const signInWithPassword = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("Logged in session:", data.session);
      Alert.alert("Success", "You are now logged in!");

      // Navigate to Home
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (err: any) {
      console.error("Login failed:", err);
      Alert.alert("Error", err.message || "Failed to log in");
    }
  };

  /** Sign up a new user */
  const signUpWithPassword = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      console.log("Signed up user:", data.user);
      Alert.alert(
        "Account Created",
        "Your account has been created. You can now log in."
      );

      // Optionally, automatically log in after sign up:
      // await signInWithPassword();
    } catch (err: any) {
      console.error("Sign up failed:", err);
      Alert.alert("Error", err.message || "Failed to create account");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <View style={styles.buttonContainer}>
        <Button title="Sign In" onPress={signInWithPassword} />
        <View style={{ height: 10 }} />
        <Button title="Sign Up" onPress={signUpWithPassword} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 20,
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 10,
  },
});
