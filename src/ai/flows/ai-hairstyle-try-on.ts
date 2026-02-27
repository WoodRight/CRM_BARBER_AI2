
'use server';
/**
 * @fileOverview Этот процесс позволяет клиентам загружать свои фотографии
 *   и генерировать изображения себя с различными прическами с помощью ИИ.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiHairstyleTryOnInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Фотография клиента в виде data URI. Формат: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  hairstyleDescription: z
    .string()
    .describe(
      'Описание желаемой прически (на английском для лучшего результата).'
    ),
});
export type AiHairstyleTryOnInput = z.infer<typeof AiHairstyleTryOnInputSchema>;

const AiHairstyleTryOnOutputSchema = z.object({
  generatedHairstyleImage: z
    .string()
    .describe('Data URI сгенерированного изображения с новой прической.'),
});
export type AiHairstyleTryOnOutput = z.infer<typeof AiHairstyleTryOnOutputSchema>;

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
    let finalPhotoUri = input.photoDataUri.trim();

    // Если это URL (например, из примера), скачиваем его на сервере
    if (finalPhotoUri.startsWith('http')) {
      try {
        const response = await fetch(finalPhotoUri, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        finalPhotoUri = `data:${contentType};base64,${base64}`;
      } catch (error: any) {
        throw new Error(`Ошибка загрузки изображения: ${error.message}`);
      }
    }

    // Извлекаем чистый Base64 и MIME-тип для корректной отправки в API
    const matches = finalPhotoUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Некорректный формат изображения. Попробуйте другое фото.');
    }
    const contentType = matches[1];
    const base64Data = matches[2];

    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          {
            media: {
              url: `data:${contentType};base64,${base64Data}`,
              contentType: contentType,
            },
          },
          {
            text: `Detailed task: Modify only the hair of the person in the provided image. Apply the following style: ${input.hairstyleDescription}. Ensure the face, identity, background, and lighting remain consistent with the original photo. Only change the hairstyle.`,
          },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          safetySettings: [
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          ],
        },
      });

      const media = response.media;

      if (!media || !media.url) {
        throw new Error('ИИ не смог сгенерировать изображение. Попробуйте использовать более простое описание стиля на английском языке.');
      }

      return { generatedHairstyleImage: media.url };
    } catch (error: any) {
      console.error('Genkit/Gemini Error:', error);
      const errMsg = error.message || '';
      
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Лимит запросов API исчерпан. Пожалуйста, подождите 60 секунд перед следующей попыткой.');
      }

      if (errMsg.includes('400') || errMsg.includes('invalid_argument')) {
        throw new Error('Ошибка параметров API: Скорее всего, ваш API-ключ не имеет доступа к модели Gemini 2.5 Flash Image. Убедитесь, что модель доступна в вашем Google AI Studio.');
      }
      
      throw new Error(`Ошибка ИИ: ${errMsg}`);
    }
  }
);
