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
import { z } from 'zod';

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
    const apiKey = process.env.AILAB_API_KEY || "VjEL6M5wqiYtQZnJUeTRoK3LBuzpxIw3zWrAhtHGOaW0xDrlfdn9DAyFCFMGhj1N";

    if (!apiKey) {
      throw new Error('API ключ AILabTools не найден. Пожалуйста, проверьте настройки.');
    }

    // 1. Подготовка бинарных данных из Data URI
    const parts = input.photoDataUri.split(',');
    if (parts.length < 2) {
      throw new Error('Некорректный формат изображения.');
    }
    const base64Data = parts[1];
    const mimeMatch = parts[0].match(/:(.*?);/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: contentType });

    // Получаем корректный ID прически
    const styleId = STYLE_MAP[input.hairstyleDescription] || "BuzzCut";

    const formData = new FormData();
    formData.append('task_type', 'async');
    formData.append('image', blob, 'image.jpg');
    formData.append('hair_style', styleId);

    try {
      console.log(`AILab: Отправка запроса на создание задачи (Стиль: ${styleId})...`);
      
      const createResponse = await fetch('https://www.ailabapi.com/api/portrait/effects/hairstyle-editor-pro', {
        method: 'POST',
        headers: {
          'ailabapi-api-key': apiKey,
        },
        body: formData,
      });

      const createResult = await createResponse.json();

      // Проверка на ошибки сервера или API
      if (!createResponse.ok || !createResult || createResult.error_code !== 0) {
        console.error('AILab Create Task Error:', createResult);
        const errorMsg = createResult?.error_msg || createResult?.message || `Ошибка сервера (HTTP ${createResponse.status})`;
        throw new Error(`Ошибка API (${createResult?.error_code || createResponse.status}): ${errorMsg}`);
      }

      const taskId = createResult.data?.task_id;
      if (!taskId) {
        throw new Error('Сервер не вернул ID задачи. Попробуйте использовать другое фото.');
      }

      console.log('AILab: Задача создана. ID:', taskId);

      // 3. Опрос (Polling) результата
      let resultImage = null;
      let attempts = 0;
      const maxAttempts = 15; // Максимум 75 секунд

      while (attempts < maxAttempts) {
        console.log(`AILab: Проверка статуса (попытка ${attempts + 1}/${maxAttempts})...`);
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const pollResponse = await fetch(`https://www.ailabapi.com/api/common/get_async_result?task_id=${taskId}`, {
          method: 'GET',
          headers: {
            'ailabapi-api-key': apiKey,
          },
        });

        const pollResult = await pollResponse.json();

        // task_status: 2 - успех, 1 - в очереди/обработке, 3 - ошибка
        if (pollResult.data && pollResult.data.task_status === 2) {
          resultImage = pollResult.data.result_list?.[0]?.image;
          if (resultImage) {
            console.log('AILab: Фото успешно сгенерировано!');
            break;
          }
        } else if (pollResult.data && pollResult.data.task_status === 3) {
          const failMsg = pollResult.error_msg || 'Обработка не удалась (возможно, на фото не найдено лицо)';
          throw new Error(`Ошибка обработки: ${failMsg}`);
        }

        attempts++;
      }

      if (!resultImage) {
        throw new Error('Время ожидания истекло. Попробуйте еще раз с фото меньшего размера.');
      }

      return { 
        generatedHairstyleImage: resultImage.startsWith('http') ? resultImage : `data:image/png;base64,${resultImage}` 
      };

    } catch (error: any) {
      console.error('AILabTools Critical Error:', error);
      throw new Error(error.message || 'Произошла ошибка при связи с сервером ИИ.');
    }
  }
);