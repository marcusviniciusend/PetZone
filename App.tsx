import './src/i18n';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import EditPetScreen from './src/screens/profile/EditPetScreen';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import _Icon from 'react-native-vector-icons/Ionicons';
import ChatScreen from './src/screens/social/ChatScreen';

const Icon = _Icon as React.ComponentType<{ name: string; size: number; color: string }>;
// Importando as nossas telas
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import SwipeScreen from './src/screens/social/SwipeScreen';
import MatchesScreen from './src/screens/social/MatchesScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import AddPetScreen from './src/screens/profile/AddPetScreen';
import { colors } from './src/theme/colors';
import { supabase } from './src/lib/supabase';
import locationService from './src/services/locationService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack específica para a aba de Matches, permitindo o Chat dentro dela
function MatchesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MatchesList" component={MatchesScreen} />
      <Stack.Screen name="Chat" component={ChatScreen as any} />
    </Stack.Navigator>
  );
}

// 1. Isolamos as suas Tabs em um componente separado
function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Swipe"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Swipe') {
            iconName = focused ? 'paw' : 'paw-outline'; 
          } else if (route.name === 'Matches') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Swipe" component={SwipeScreen} />
      <Tab.Screen name="Matches" component={MatchesStack} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState<'Login' | 'Register'>('Login');

  useEffect(() => {
    // Checa se o usuário já tem uma sessão salva ao abrir o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Fica escutando qualquer mudança de login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        locationService.updateUserLocation(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Tela de carregamento enquanto verifica o banco
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    if (authScreen === 'Login') {
      return <LoginScreen onNavigateRegister={() => setAuthScreen('Register')} />;
    } else {
      return <RegisterScreen onNavigateLogin={() => setAuthScreen('Login')} />;
    }
  }

  // 2. Com sessão válida: O Stack gerencia as Tabs e a tela AddPet
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* O fluxo principal com a barra inferior */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        
        {/* A nova tela que abre por cima (sobrepondo a barra) */}
        <Stack.Screen name="AddPet" component={AddPetScreen} />
        <Stack.Screen name="EditPet" component={EditPetScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
