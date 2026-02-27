'use server';
/**
 * @fileOverview Этот процесс использует API AILabTools (Hairstyle Editor Pro)
 * для реалистичной примерки причесок на фото пользователя.
 * 
 * Интеграция настроена согласно документации AILabTools.
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

/**
 * Карта соответствия названий стилей индексам AILabTools (hair_style)
 * 1: Pompadour, 3: Short/Fade, 7: Man Bun, 8: Side Part, 10: Quiff и т.д.
 */
const STYLE_MAP: Record<string, number> = {
  // English keys
  "Classic Fade": 3,
  "Pompadour": 1,
  "Textured Quiff": 10,
  "Side Part": 8,
  "Man Bun": 7,
  "Buzz Cut": 3,
  "Long Curls": 4,
  "Taper Fade": 9,
  // Russian keys
  "Фейд": 3,
  "Классический Помпадур": 1,
  "Текстурированный Квифф": 10,
  "Пробор на бок": 8,
  "Мужской пучок": 7,
  "Бокс": 3,
  "Длинные кудри": 4,
  "Тейпер": 9,
  "Квифф": 10
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
      throw new Error('Ключ API AILabTools (AILAB_APP_KEY) не найден в .env');
    }

    if (!appId) {
      throw new Error('App ID для AILabTools не найден. Проверьте поле AILAB_APP_ID в .env');
    }

    // Очищаем base64 от префикса (API требует чистый base64 без "data:image/png;base64,")
    const base64Image = input.photoDataUri.includes(',') 
      ? input.photoDataUri.split(',')[1] 
      : input.photoDataUri;
    
    // Определяем индекс прически (по умолчанию 3 - короткая мужская)
    const styleIndex = STYLE_MAP[input.hairstyleDescription] || 3;

    // Параметры запроса согласно документации AILabTools
    const formData = new URLSearchParams();
    formData.append('app_id', appId); 
    formData.append('app_key', appKey);
    formData.append('image', base64Image);
    formData.append('task_type', 'hairstyle');
    formData.append('hair_style', styleIndex.toString());

    try {
      const response = await fetch('https://api-us.ailabtools.com/ai/portrait/effects/hairstyle-editor-pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`Ошибка сети: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Обработка ошибок самого API AILabTools
      if (result.error_code !== 0) {
        let errorMsg = result.error_msg;
        if (result.error_code === 10001) errorMsg = "Неверный App ID или App Key. Проверьте данные в .env";
        if (result.error_code === 10003) errorMsg = "Недостаточно средств на балансе AILabTools.";
        
        throw new Error(`AILabTools Error: ${errorMsg} (Код: ${result.error_code})`);
      }

      if (!result.data || !result.data.image) {
        throw new Error('API успешно отработало, но не вернуло изображение. Возможно, лицо на фото не распознано.');
      }

      return { 
        generatedHairstyleImage: `data:image/png;base64,${result.data.image}` 
      };
    } catch (error: any) {
      console.error('AILabTools Flow Error:', error);
      throw new Error(error.message || 'Произошла ошибка при обработке фото через AILabTools');
    }
  }
);
