'use server';
/**
 * @fileOverview Этот процесс использует API AILabTools (AILabAPI)
 * для реалистичной примерки причесок на фото пользователя.
 * 
 * Интеграция настроена согласно предоставленному CURL:
 * - Эндпоинт: https://www.ailabapi.com/api/portrait/effects/hairstyle-editor-pro
 * - Авторизация: заголовок 'ailabapi-api-key'
 * - Режим: task_type=async
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiHairstyleTryOnInputSchema = z.object({
  photoDataUri: z.string().describe("Фото пользователя в формате Data URI."),
  hairstyleDescription: z.string().describe('Название или описание прически.'),
});
export type AiHairstyleTryOnInput = z.infer<typeof AiHairstyleTryOnInputSchema>;

const AiHairstyleTryOnOutputSchema = z.object({
  generatedHairstyleImage: z.string().describe('Data URI или URL обработанного изображения.'),
});
export type AiHairstyleTryOnOutput = z.infer<typeof AiHairstyleTryOnOutputSchema>;

/**
 * Карта соответствия названий причесок строковым идентификаторам AILabTools.
 * Используем только поддерживаемые строковые значения из официального списка API.
 */
const STYLE_MAP: Record<string, string> = {
  "Фейд": "LowFade",
  "Классический Помпадур": "Pompadour",
  "Текстурированный Квифф": "TexturedFringe",
  "Пробор на бок": "Side-Parted_Textured",
  "Мужской пучок": "ManBun",
  "Бокс": "BuzzCut",
  "Длинные кудри": "LongCurly",
  "Тейпер": "HighTightFade",
  "Квифф": "TexturedFringe",
  "Андеркат": "UnderCut",
  "Афро": "Afro",
  "Дреды": "Dreadlocks"
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
    const apiKey = process.env.AILAB_API_KEY;

    if (!apiKey) {
      throw new Error('API ключ AILabTools (AILAB_API_KEY) не найден в .env');
    }

    // 1. Подготовка бинарных данных из Data URI
    const parts = input.photoDataUri.split(',');
    if (parts.length < 2) {
      throw new Error('Некорректный формат изображения.');
    }
    const base64Data = parts[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Создаем объект File для корректной работы multipart/form-data в Node.js
    const file = new File([buffer], 'user_photo.jpg', { type: 'image/jpeg' });

    // Получаем корректный ID прически или используем BuzzCut как надежный стандарт
    const styleId = STYLE_MAP[input.hairstyleDescription] || "BuzzCut";

    const formData = new FormData();
    formData.append('task_type', 'async');
    formData.append('image', file);
    formData.append('hair_style', styleId);

    try {
      // 2. Создание асинхронной задачи
      const createResponse = await fetch('https://www.ailabapi.com/api/portrait/effects/hairstyle-editor-pro', {
        method: 'POST',
        headers: {
          'ailabapi-api-key': apiKey,
        },
        body: formData,
      });

      const createResult = await createResponse.json();

      // Проверка на ошибки API или отсутствие данных
      if (!createResult || createResult.error_code !== 0 || !createResult.data) {
        console.error('AILab Create Task Error Payload:', createResult);
        const errorMsg = createResult?.error_msg || createResult?.message || 'Сервер вернул пустой ответ или некорректные параметры';
        throw new Error(`Ошибка API (${createResult?.error_code || 'Unknown'}): ${errorMsg}`);
      }

      const taskId = createResult.data.task_id;
      if (!taskId) {
        throw new Error('Сервер не вернул ID задачи. Попробуйте еще раз с другим фото.');
      }

      // 3. Опрос (Polling) результата
      let resultImage = null;
      let attempts = 0;
      const maxAttempts = 12; // Максимум 1 минута ожидания (12 * 5 сек)

      while (attempts < maxAttempts) {
        // Ждем 5 секунд перед следующим опросом
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const pollResponse = await fetch(`https://www.ailabapi.com/api/common/get_async_result?task_id=${taskId}`, {
          method: 'GET',
          headers: {
            'ailabapi-api-key': apiKey,
          },
        });

        const pollResult = await pollResponse.json();

        // Статус 2 означает успех
        if (pollResult.data && pollResult.data.task_status === 2 && pollResult.data.result_list?.[0]?.image) {
          resultImage = pollResult.data.result_list[0].image;
          break;
        } 
        // Статус 3 означает ошибку обработки
        else if (pollResult.data && pollResult.data.task_status === 3) {
          throw new Error(`Ошибка обработки: ${pollResult.error_msg || 'Сервер отклонил фото (возможно, лицо не распознано)'}`);
        }

        attempts++;
      }

      if (!resultImage) {
        throw new Error('Время ожидания обработки истекло. Попробуйте фото меньшего размера.');
      }

      return { 
        generatedHairstyleImage: resultImage.startsWith('http') ? resultImage : `data:image/png;base64,${resultImage}` 
      };

    } catch (error: any) {
      console.error('AILabTools Process Error:', error);
      throw new Error(error.message || 'Произошла ошибка при связи с сервером AILabTools');
    }
  }
);