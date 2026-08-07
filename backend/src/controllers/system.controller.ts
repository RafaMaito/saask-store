import { Request, Response } from 'express';
import { SystemConfig } from '../models/SystemConfig.js';

/**
 * Controlador de Configurações Globais da Plataforma (System Configuration & Global AI Settings Controller)
 */
export class SystemController {
  /**
   * Obtém a Configuração Global de IA Ativa (Get Active Global AI System Configuration)
   */
  static async getConfig(req: Request, res: Response) {
    try {
      let config = await SystemConfig.findOne();
      if (!config) {
        config = await SystemConfig.create({
          aiProvider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: '',
          baseURL: '',
        });
      }

      const configObject = config.toObject ? config.toObject() : config;

      // Se não for superadmin, não expõe a chave de API completa por segurança (Obfuscate API Key for non-superadmin)
      if (req.user?.role !== 'superadmin' && configObject.apiKey) {
        configObject.apiKey = configObject.apiKey.substring(0, 4) + '***' + configObject.apiKey.slice(-4);
      }

      return res.status(200).json({ config: configObject });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Atualiza a Configuração Global de IA da Plataforma (Update Global Platform AI Provider Configuration - Superadmin Only)
   */
  static async updateConfig(req: Request, res: Response) {
    try {
      const { aiProvider, model, apiKey, baseURL, systemPrompt } = req.body;

      let config = await SystemConfig.findOne();
      if (!config) {
        config = new SystemConfig();
      }

      if (aiProvider) config.aiProvider = aiProvider;
      if (model) config.model = model;
      if (apiKey !== undefined) config.apiKey = apiKey;
      if (baseURL !== undefined) config.baseURL = baseURL;
      if (systemPrompt !== undefined) config.systemPrompt = systemPrompt;

      await config.save();

      return res.status(200).json({
        message: 'Configuração de IA atualizada com sucesso (Global AI settings updated successfully)',
        config,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
