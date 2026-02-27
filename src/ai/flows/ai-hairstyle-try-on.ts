
'use server';
/**
 * @fileOverview Этот процесс использует API AILabTools (Hairstyle Editor Pro)
 * для реалистичной примерки причесок на фото пользователя.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiHairstyleTryOnInputSchema = z.object({
  photoDataUri: z.string().describe("Фото пользователя в формате Data URI."),
  hairstyleDescription: z.string().describe('Название или описание прически.'),
});
export type AiHairstyleTryOnInput = z.infer<typeof AiHairstyleTryOnInputSchema>;

const AiHairstyleTryOnOutputSchema = z.object({
  generatedHairstyleImage: z.string().describe('Data URI обработанного изображения.'),
});
export type AiHairstyleTryOnOutput = z.infer<typeof AiHairstyleTryOnOutputSchema>;

// Карта соответствия стилей StylePro AI индексам AILabTools
const STYLE_MAP: Record<string, number> = {
  "Classic Fade": 3,
  "Pompadour": 1,
  "Textured Quiff": 10,
  "Side Part": 8,
  "Man Bun": 7,
  "Buzz Cut": 3,
  "Long Curls": 4,
  "Taper Fade": 9,
  "Бокс": 3,
  "Классический Помпадур": 1,
  "Фейд": 3,
  "Текстурированный Квифф": 10,
  "Пробор на бок": 8
};

export async function aiHairstyleTryOn(
  input: AiHairstyleTryOnInput
): Promise<AiHairstyleTryOnOutput> {
  return aiHairstyleTryOnFlow(input);
}

const aiHairstyleTryOnFlow = ai.defineFlow(
  {
    name: 'aiHairstyleTryOnFlow',
    inputSchema: AiHairstyleTryOnInputSchema,
    outputSchema: AiHairstyleTryOnOutputSchema,
  },
  async (input) => {
    const appKey = process.env.AILAB_APP_KEY;
    const appId = process.env.AILAB_APP_ID;

    if (!appKey) {
      throw new Error('Ключ API AILabTools не настроен в .env');
    }

    // Очищаем base64 от префикса
    const base64Image = input.photoDataUri.split(',')[1];
    
    // Определяем индекс прически (по умолчанию 3 - короткая мужская)
    const styleIndex = STYLE_MAP[input.hairstyleDescription] || 3;

    try {
      const response = await fetch('https://api-us.ailabtools.com/ai/portrait/effects/hairstyle-editor-pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId || "default_id", // Некоторые API требуют ID, попробуем передать заглушку если нет в .env
          app_key: appKey,
          image: base64Image,
          task_type: 'hairstyle',
          hair_style: styleIndex
        }),
      });

      const result = await response.json();

      if (result.error_code !== 0) {
        throw new Error(`Ошибка AILabTools: ${result.error_msg} (Код: ${result.error_code})`);
      }

      if (!result.data || !result.data.image) {
        throw new Error('API не вернуло изображение.');
      }

      return { 
        generatedHairstyleImage: `data:image/png;base64,${result.data.image}` 
      };
    } catch (error: any) {
      console.error('AILabTools Error:', error);
      throw new Error(`Ошибка сервиса обработки: ${error.message || 'Неизвестная ошибка'}`);
    }
  }
);
