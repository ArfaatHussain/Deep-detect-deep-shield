import React from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider, ThemeContext } from './src/context/ThemeContext';

import AppNavigation from './src/navigation/AppNavigation';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
const App = () => {
  return (
    <SafeAreaProvider style={{ flex: 1 }} >

      <SafeAreaView style={{flex:1}} >

        <ThemeProvider>
          <ThemeContext.Consumer>
            {({ darkTheme }) => (
              <AppNavigation darkTheme={darkTheme}>
                <StatusBar
                  barStyle={darkTheme ? 'light-content' : 'dark-content'}
                />
              </AppNavigation>
            )}
          </ThemeContext.Consumer>
        </ThemeProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;
