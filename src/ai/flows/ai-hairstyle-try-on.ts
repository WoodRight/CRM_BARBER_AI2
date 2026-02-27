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
 * Карта соответствия названий причесок индексам AILabTools
 * Используем строковые значения, так как FormData передает всё как строки.
 */
const STYLE_MAP: Record<string, string> = {
  "Фейд": "3",
  "Классический Помпадур": "1",
  "Текстурированный Квифф": "10",
  "Пробор на бок": "8",
  "Мужской пучок": "7",
  "Бокс": "3",
  "Длинные кудри": "4",
  "Тейпер": "9",
  "Квифф": "10"
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
    const base64Data = input.photoDataUri.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Создаем объект File для корректной работы multipart/form-data в Node.js
    const file = new File([buffer], 'user_photo.jpg', { type: 'image/jpeg' });

    const styleId = STYLE_MAP[input.hairstyleDescription] || "3";

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
          // НЕ устанавливаем Content-Type вручную, fetch сделает это сам с правильным boundary
        },
        body: formData,
      });

      const createResult = await createResponse.json();

      // Обработка ошибок создания задачи (включая "invalid parametr")
      if (createResult.error_code !== 0) {
        console.error('AILab Create Task Error Payload:', createResult);
        throw new Error(`Ошибка API (${createResult.error_code}): ${createResult.error_msg || 'Некорректные параметры запроса'}`);
      }

      const taskId = createResult.data.task_id;
      if (!taskId) {
        throw new Error('Сервер не вернул ID задачи. Попробуйте еще раз.');
      }

      // 3. Опрос (Polling) результата
      let resultImage = null;
      let attempts = 0;
      const maxAttempts = 15; // Увеличиваем до 75 секунд ожидания

      while (attempts < maxAttempts) {
        // Ожидание перед каждой проверкой (первое ожидание 5 сек)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const pollResponse = await fetch(`https://www.ailabapi.com/api/common/get_async_result?task_id=${taskId}`, {
          method: 'GET',
          headers: {
            'ailabapi-api-key': apiKey,
          },
        });

        const pollResult = await pollResponse.json();

        // task_status: 2 - успех, 1 - в работе, 3 - ошибка
        if (pollResult.data && pollResult.data.task_status === 2) {
          resultImage = pollResult.data.result_list[0].image;
          break;
        } else if (pollResult.data && pollResult.data.task_status === 3) {
          throw new Error(`Ошибка обработки: ${pollResult.error_msg || 'Сервер отклонил фото'}`);
        }

        attempts++;
      }

      if (!resultImage) {
        throw new Error('Время ожидания истекло. Возможно, фото слишком большое для обработки.');
      }

      // Возвращаем результат (URL или Base64 в зависимости от того, что вернет API)
      return { 
        generatedHairstyleImage: resultImage.startsWith('http') ? resultImage : `data:image/png;base64,${resultImage}` 
      };

    } catch (error: any) {
      console.error('AILabTools Process Error:', error);
      throw new Error(error.message || 'Произошла ошибка при связи с сервером AILabTools');
    }
  }
);
