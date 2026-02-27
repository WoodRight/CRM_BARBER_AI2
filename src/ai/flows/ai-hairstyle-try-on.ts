'use server';
/**
 * @fileOverview Этот процесс использует API AILabTools (AILabAPI)
 * для асинхронной примерки причесок.
 * 
 * Логика переписана в точном соответствии с предоставленным Python примером и документацией:
 * 1. POST на /hairstyle-editor-pro с task_type=async и auto=1.
 * 2. Получение task_id из корня ответа.
 * 3. Циклический опрос /query-async-task-result через GET каждые 5 секунд.
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
 * Взято из предоставленного списка Male/Female стилей.
 */
const STYLE_MAP: Record<string, string> = {
  "Бокс": "BuzzCut",
  "Фейд": "LowFade",
  "Классический Помпадур": "Pompadour",
  "Текстурированный Квифф": "TexturedFringe",
  "Пробор на бок": "Side-Parted_Textured",
  "Мужской пучок": "ManBun",
  "Андеркат": "UnderCut",
  "Афро": "Afro",
  "Длинные кудри": "LongCurly",
  "Дреды": "Dreadlocks",
  "Тейпер": "HighTightFade",
  "Квифф": "TexturedFringe"
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
    const apiKey = "VjEL6M5wqiYtQZnJUeTRoK3LBuzpxIw3zWrAhtHGOaW0xDrlfdn9DAyFCFMGhj1N";

    // 1. Подготовка бинарных данных изображения
    const parts = input.photoDataUri.split(',');
    if (parts.length < 2) {
      throw new Error('Некорректный формат изображения.');
    }
    const base64Data = parts[1];
    const mimeMatch = parts[0].match(/:(.*?);/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: contentType });

    const styleId = STYLE_MAP[input.hairstyleDescription] || "BuzzCut";

    // Формируем FormData в соответствии с Body Fixed Fields документации
    const formData = new FormData();
    formData.append('task_type', 'async');
    formData.append('auto', '1');
    formData.append('image', blob, 'image.jpg');
    formData.append('hair_style', styleId);
    // По желанию можно добавить color или image_size
    // formData.append('image_size', '1');

    try {
      console.log(`AILab: Отправка задачи... (Стиль: ${styleId})`);
      
      const createResponse = await fetch('https://www.ailabapi.com/api/portrait/effects/hairstyle-editor-pro', {
        method: 'POST',
        headers: {
          'ailabapi-api-key': apiKey,
        },
        body: formData,
      });

      const createResult = await createResponse.json();

      if (!createResponse.ok || createResult.error_code !== 0) {
        console.error('AILab Create Task Error:', createResult);
        throw new Error(`Ошибка API (${createResult.error_code}): ${createResult.error_msg || 'Не удалось создать задачу'}`);
      }

      // Согласно Response Example, task_id находится в корне объекта
      const taskId = createResult.task_id;
      
      if (!taskId) {
        console.error('AILab Response structure:', createResult);
        throw new Error('Сервер не вернул task_id. Попробуйте другое фото или проверьте лимиты API.');
      }

      console.log('AILab: Задача создана успешно. ID:', taskId);

      // 2. Опрос (Polling) статуса как в примере: каждые 5 секунд
      let resultImage = null;
      let attempts = 0;
      const maxAttempts = 24; // Ожидаем до 2 минут (24 * 5 сек)

      const queryUrl = "https://www.ailabapi.com/api/common/query-async-task-result";

      while (attempts < maxAttempts) {
        attempts++;
        console.log(`AILab: Проверка статуса... (Попытка ${attempts}/${maxAttempts})`);
        
        // Ждем 5 секунд перед следующим запросом
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const pollResponse = await fetch(`${queryUrl}?task_id=${taskId}`, {
          method: 'GET',
          headers: {
            'ailabapi-api-key': apiKey,
          },
        });

        const pollResult = await pollResponse.json();

        if (pollResult.error_code !== 0) {
          throw new Error(`Ошибка проверки статуса: ${pollResult.error_msg}`);
        }

        /**
         * task_status: 
         * 0: Queued
         * 1: Processing
         * 2: Success
         */
        const taskStatus = pollResult.task_status;
        console.log(`AILab: Текущий статус задачи: ${taskStatus}`);

        if (taskStatus === 2) {
          // Успех! Согласно Business Response Fields, результат в data.images
          const images = pollResult.data?.images;
          resultImage = images?.[0];
          
          if (resultImage) {
            console.log('AILab: Изображение успешно получено!');
            break;
          } else {
            throw new Error('Статус задачи 2, но массив изображений пуст.');
          }
        } else if (taskStatus === 3 || (pollResult.error_code !== 0)) {
          // В документации 0, 1, 2, но на практике 3 может означать ошибку выполнения
          throw new Error(`Ошибка обработки на стороне сервера: ${pollResult.error_msg || 'Unknown error'}`);
        }
      }

      if (!resultImage) {
        throw new Error('Превышено время ожидания обработки. Попробуйте позже.');
      }

      return { 
        generatedHairstyleImage: resultImage 
      };

    } catch (error: any) {
      console.error('AILabTools Critical Error:', error);
      throw new Error(error.message || 'Произошла ошибка при связи с сервером ИИ.');
    }
  }
);
