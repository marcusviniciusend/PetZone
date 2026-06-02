import { supabase } from '../lib/supabase';

export const authService = {
  // Função para criar uma nova conta
  async signUp(email: string, password: string, name: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Erro ao cadastrar:', error.message);
        return { success: false, error: error.message };
      }

      // NOVA PARTE: Salva o nome na tabela profiles logo após criar a conta
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, full_name: name }]);

        if (profileError) {
          return { success: false, error: 'Conta criada, mas houve um erro ao salvar o perfil. Tente fazer login.' };
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Falha no serviço de cadastro:', error);
      return { success: false, error: 'Erro inesperado no cadastro' };
    }
  },

  // Função para entrar em uma conta existente
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Erro ao fazer login:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Falha no serviço de login:', error);
      return { success: false, error: 'Erro inesperado no login' };
    }
  },

  // Função para sair da conta (Logout)
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { success: false };
    }
  }
};