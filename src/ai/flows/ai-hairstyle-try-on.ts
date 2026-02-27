'use server';
/**
 * @fileOverview Этот процесс использует обновленный API AILabTools (AILabAPI)
 * для реалистичной примерки причесок на фото пользователя.
 * 
 * Интеграция настроена согласно предоставленному CURL:
 * - Эндпоинт: https://www.ailabapi.com/api/portrait/effects/hairstyle-editor-pro
 * - Авторизация: заголовок 'ailabapi-api-key'
 * - Режим: task_type=async с последующим получением результата по task_id.
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
 * Карта соответствия названий причесок индексам AILabTools
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

    // 1. Подготовка данных (переводим Data URI в Blob/File для multipart/form-data)
    const base64Content = input.photoDataUri.split(',')[1];
    const styleId = STYLE_MAP[input.hairstyleDescription] || "3";

    const formData = new FormData();
    formData.append('task_type', 'async');
    formData.append('image', base64Content); // API AILab часто принимает base64 в поле image
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

      if (createResult.error_code !== 0) {
        throw new Error(`AILabTools Create Error: ${createResult.error_msg} (Код: ${createResult.error_code})`);
      }

      const taskId = createResult.data.task_id;
      if (!taskId) {
        throw new Error('API не вернуло task_id. Возможно, сервис перегружен.');
      }

      // 3. Опрос (Polling) результата задачи
      let resultImage = null;
      let attempts = 0;
      const maxAttempts = 12; // Максимум 60 секунд ожидания (12 * 5 сек)

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Ждем 5 секунд между проверками
        
        const pollResponse = await fetch(`https://www.ailabapi.com/api/common/get_async_result?task_id=${taskId}`, {
          method: 'GET',
          headers: {
            'ailabapi-api-key': apiKey,
          },
        });

        const pollResult = await pollResponse.json();

        // Статус задачи (2: завершено успешно, 1: в процессе, 3: ошибка)
        if (pollResult.data && pollResult.data.task_status === 2) {
          resultImage = pollResult.data.result_list[0].image;
          break;
        } else if (pollResult.data && pollResult.data.task_status === 3) {
          throw new Error(`Ошибка обработки на стороне сервера AILab: ${pollResult.error_msg}`);
        }

        attempts++;
      }

      if (!resultImage) {
        throw new Error('Время ожидания обработки фото истекло. Попробуйте еще раз с фото меньшего размера.');
      }

      return { 
        generatedHairstyleImage: resultImage.startsWith('http') ? resultImage : `data:image/png;base64,${resultImage}` 
      };

    } catch (error: any) {
      console.error('AILabTools Polling Error:', error);
      throw new Error(error.message || 'Произошла ошибка при связи с сервером AILabTools');
    }
  }
);
