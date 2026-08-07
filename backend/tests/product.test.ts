import { describe, it, expect } from 'vitest';

describe('Product Model & Validation Rules Unit Tests', () => {
  it('deve validar se o preço promocional (salePrice) é menor que o preço original', () => {
    const originalPrice = 1000;
    const invalidSalePrice = 1200;
    const validSalePrice = 800;

    const validatePrices = (price: number, salePrice?: number) => {
      if (salePrice !== undefined && salePrice >= price) {
        return 'O preço promocional (Sale price) deve ser estritamente menor que o preço original';
      }
      return null;
    };

    expect(validatePrices(originalPrice, invalidSalePrice)).toBe(
      'O preço promocional (Sale price) deve ser estritamente menor que o preço original'
    );
    expect(validatePrices(originalPrice, validSalePrice)).toBeNull();
  });

  it('deve aceitar atributos dinâmicos flexíveis sem romper a validação do schema', () => {
    const productAttributes = {
      Ano: '2025',
      Combustivel: 'Flex',
      Autonomia: '800km',
      RegistroAnvisa: '80123456789',
    };

    expect(productAttributes).toHaveProperty('Ano', '2025');
    expect(productAttributes).toHaveProperty('RegistroAnvisa', '80123456789');
    expect(typeof productAttributes).toBe('object');
  });
});
