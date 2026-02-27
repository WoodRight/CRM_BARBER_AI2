'use server';
/**
 * @fileOverview Этот процесс использует API AILabTools (AILabAPI)
 * для асинхронной примерки причесок.
 * 
 * Логика переписана в точном соответствии с предоставленным Python примером:
 * 1. POST на /hairstyle-editor-pro с task_type=async.
 * 2. Получение task_id (проверка в корне и в data).
 * 3. Циклический опрос /query-async-task-result каждые 5 секунд.
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

    // 1. Подготовка бинарных данных
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

    // Формируем FormData в точности как в requests.post(..., data=data, files=files)
    const formData = new FormData();
    formData.append('task_type', 'async');
    formData.append('image', blob, 'image.jpg');
    formData.append('hair_style', styleId);

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

      // Проверяем ID задачи как в data, так и в корне (разные версии API возвращают по-разному)
      const taskId = createResult.data?.task_id || createResult.task_id;
      
      if (!taskId) {
        console.error('AILab Response structure:', createResult);
        throw new Error('Сервер не вернул task_id. Попробуйте другое фото или проверьте лимиты API.');
      }

      console.log('AILab: Задача создана успешно. ID:', taskId);

      // 2. Опрос (Polling) статуса как в Python: while True -> sleep(5)
      let resultImage = null;
      let attempts = 0;
      const maxAttempts = 30; // Ожидаем до 150 секунд

      const queryUrl = "https://www.ailabapi.com/api/common/query-async-task-result";

      while (attempts < maxAttempts) {
        attempts++;
        console.log(`AILab: Ожидание результата... (Попытка ${attempts}/${maxAttempts})`);
        
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

        // task_status: 2 - готово, 0/1 - в очереди или обработке
        const taskStatus = pollResult.task_status !== undefined ? pollResult.task_status : (pollResult.data?.task_status);
        console.log(`AILab: Текущий статус задачи: ${taskStatus}`);

        if (taskStatus === 2) {
          // Успех! Извлекаем изображение
          // В асинхронных задачах результат часто лежит в data.result_list или просто в data.image
          const data = pollResult.data;
          resultImage = data?.result_list?.[0]?.image || data?.image || data?.url;
          
          if (resultImage) {
            console.log('AILab: Изображение успешно получено!');
            break;
          }
        } else if (taskStatus === 3) {
          throw new Error('Ошибка обработки на стороне сервера (возможно, лицо не найдено)');
        }
      }

      if (!resultImage) {
        throw new Error('Превышено время ожидания обработки или сервер не вернул URL изображения.');
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
