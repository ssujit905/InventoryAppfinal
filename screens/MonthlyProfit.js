// screens/Dashboard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';

const Dashboard = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: colors.text,
  },
});

export default Dashboard;
