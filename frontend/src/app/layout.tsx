import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { NeonAuthUIProvider } from '@neondatabase/auth/react';
import { authClient } from '@/lib/auth/client';


// --- CONFIGURAÇÃO DE FONTES ---
// Configuração da Inter como fonte padrão para manter a consistência visual do sistema
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- METADADOS DO SISTEMA ---
export const metadata: Metadata = {
  title: "SmileCorp",
  description: "Sistema inteligente de gestão de estoque e finanças",
};

// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <html lang="pt-BR" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen`}>
               <NeonAuthUIProvider
  authClient={authClient as any}
  redirectTo="/account/settings"
  emailOTP
  localization={{
    // Auth pages
    SIGN_IN: "Entrar",
    SIGN_UP: "Criar conta",
    SIGN_OUT: "Sair",
    SIGN_IN_ACTION: "Entrar",
    SIGN_UP_ACTION: "Criar uma conta",
    SIGN_IN_DESCRIPTION: "Digite seu email abaixo para entrar na sua conta",
    SIGN_UP_DESCRIPTION: "Digite suas informações para criar uma conta",
    ALREADY_HAVE_AN_ACCOUNT: "Já tem uma conta?",
    DONT_HAVE_AN_ACCOUNT: "Não tem uma conta?",
    OR_CONTINUE_WITH: "Ou continue com",

    // Fields
    EMAIL: "E-mail",
    EMAIL_PLACEHOLDER: "m@exemplo.com",
    EMAIL_REQUIRED: "E-mail é obrigatório",
    PASSWORD: "Senha",
    PASSWORD_PLACEHOLDER: "Senha",
    PASSWORD_REQUIRED: "Senha é obrigatória",
    CONFIRM_PASSWORD: "Confirmar senha",
    CONFIRM_PASSWORD_PLACEHOLDER: "Confirmar senha",
    NAME: "Nome",
    NAME_PLACEHOLDER: "Nome",

    // Password reset
    FORGOT_PASSWORD: "Esqueceu a senha",
    FORGOT_PASSWORD_LINK: "Esqueceu sua senha?",
    FORGOT_PASSWORD_DESCRIPTION: "Digite seu e-mail para redefinir sua senha",
    FORGOT_PASSWORD_ACTION: "Enviar link de redefinição",
    FORGOT_PASSWORD_EMAIL: "Verifique seu e-mail para o link de redefinição.",
    RESET_PASSWORD: "Redefinir senha",
    RESET_PASSWORD_ACTION: "Salvar nova senha",
    RESET_PASSWORD_DESCRIPTION: "Digite sua nova senha abaixo",
    RESET_PASSWORD_SUCCESS: "Senha redefinida com sucesso",

    // Errors
    PASSWORDS_DO_NOT_MATCH: "As senhas não coincidem",
    INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha inválidos",
    USER_NOT_FOUND: "Usuário não encontrado",
    USER_ALREADY_EXISTS: "Usuário já existe",

    // Account
    SETTINGS: "Configurações",
    ACCOUNT: "Conta", 
    SECURITY: "Segurança",
    SAVE: "Salvar",
    CANCEL: "Cancelar",
    DELETE: "Excluir",
    UPDATE: "Atualizar",
    UPDATED_SUCCESSFULLY: "Atualizado com sucesso",
    CHANGE_PASSWORD: "Alterar senha",
    CHANGE_PASSWORD_SUCCESS: "Sua senha foi alterada.",
    DELETE_ACCOUNT: "Excluir conta",
    DELETE_ACCOUNT_DESCRIPTION: "Remover permanentemente sua conta e todo o seu conteúdo.",
    SESSIONS: "Sessões",
    SESSIONS_DESCRIPTION: "Gerencie suas sessões ativas e revogue acessos.",

    // Name field
NAME_DESCRIPTION: "Por favor, insira seu nome completo ou um nome de exibição.",
NAME_INSTRUCTIONS: "Use no máximo 32 caracteres.",

// Email field
EMAIL_DESCRIPTION: "Digite o endereço de e-mail que você usa para fazer login.",
EMAIL_INSTRUCTIONS: "Por favor, insira um endereço de e-mail válido.",
EMAIL_VERIFY_CHANGE: "Verifique seu e-mail para confirmar a alteração.",

// Change password
CHANGE_PASSWORD_DESCRIPTION: "Digite sua senha atual e uma nova senha.",
CHANGE_PASSWORD_INSTRUCTIONS: "Use no mínimo 8 caracteres.",
CURRENT_PASSWORD: "Senha atual",
CURRENT_PASSWORD_PLACEHOLDER: "Senha atual",
NEW_PASSWORD: "Nova senha",
NEW_PASSWORD_PLACEHOLDER: "Nova senha",

// Delete account
DELETE_ACCOUNT_INSTRUCTIONS: "Por favor, confirme a exclusão da sua conta. Esta ação não pode ser desfeita.",

// Sessions
CURRENT_SESSION: "Sessão atual",

// Avatar
AVATAR: "Avatar",
AVATAR_DESCRIPTION: "Clique no avatar para enviar um personalizado.",
AVATAR_INSTRUCTIONS: "Um avatar é opcional, mas altamente recomendado.",
DELETE_AVATAR: "Excluir avatar",
UPLOAD_AVATAR: "Enviar avatar",

// Providers
PROVIDERS: "Provedores",
PROVIDERS_DESCRIPTION: "Conecte sua conta a um serviço de terceiros.",

// Password set (for social-only accounts)
SET_PASSWORD: "Definir senha",
SET_PASSWORD_DESCRIPTION: "Clique no botão abaixo para receber um e-mail para configurar uma senha.",

// Two-factor
TWO_FACTOR: "Dois fatores",
TWO_FACTOR_CARD_DESCRIPTION: "Adicione uma camada extra de segurança à sua conta.",

SIGN_IN_WITH: "Entrar com",
EMAIL_OTP: "código por e-mail",
EMAIL_OTP_DESCRIPTION: "Digite seu e-mail para receber um código",
EMAIL_OTP_SEND_ACTION: "Enviar código",
EMAIL_OTP_VERIFY_ACTION: "Verificar código",
EMAIL_OTP_VERIFICATION_SENT: "Verifique seu e-mail para o código de verificação.",  

ONE_TIME_PASSWORD: "Senha de uso único",
RESEND_CODE: "Reenviar código",
SEND_VERIFICATION_CODE: "Enviar código de verificação",
GO_BACK: "Voltar",
  }}
> 
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </NeonAuthUIProvider>

      </body>
    </html>
  );
}