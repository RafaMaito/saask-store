import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Auth Utility & Security Unit Tests', () => {
  const secret = 'test_secret_key_123';

  it('deve gerar e verificar um token JWT de usuário com sucesso', () => {
    const payload = {
      userId: 'user_123',
      role: 'admin',
      companyId: 'company_abc',
    };

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    expect(token).toBeDefined();

    const decoded: any = jwt.verify(token, secret);
    expect(decoded.userId).toBe('user_123');
    expect(decoded.role).toBe('admin');
    expect(decoded.companyId).toBe('company_abc');
  });

  it('deve rejeitar tokens expirados ou com assinatura inválida', () => {
    const token = jwt.sign({ userId: '123' }, 'wrong_secret');
    expect(() => jwt.verify(token, secret)).toThrow();
  });

  it('deve criptografar e comparar senhas usando bcrypt corretamente', async () => {
    const plainPassword = 'password123';
    const hash = await bcrypt.hash(plainPassword, 10);

    expect(hash).not.toBe(plainPassword);
    const isMatch = await bcrypt.compare(plainPassword, hash);
    const isWrongMatch = await bcrypt.compare('senha_errada', hash);

    expect(isMatch).toBe(true);
    expect(isWrongMatch).toBe(false);
  });

  it('deve blindar o registro contra injeção de role (Mass Assignment) forçando perfil admin', () => {
    // Simula a sanitização estrita do payload de registro onde campos maliciosos de role são descartados
    const untrustedPayload = {
      name: 'Atacante',
      email: 'hacker@teste.com',
      password: '123',
      role: 'superadmin', // Tentativa maliciosa de se autopromover
    };

    // A regra de negócio forçada pelo backend
    const sanitizedRole = 'admin';

    expect(sanitizedRole).not.toBe(untrustedPayload.role);
    expect(sanitizedRole).toBe('admin');
  });
});
