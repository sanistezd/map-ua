export const WELCOME_EMAIL_PORT = Symbol('WELCOME_EMAIL_PORT');

export interface WelcomeEmailPort {
  enqueue(email: string): Promise<void>;
}
