
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
      "Фотография клиента в виде data URI или URL-ссылки."
    ),
  hairstyleDescription: z
    .string()
    .describe(
      'Описание желаемой прически.'
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
    let finalPhotoUri = input.photoDataUri;

    // Серверная загрузка для обхода CORS и оптимизации
    if (finalPhotoUri.startsWith('http')) {
      try {
        const response = await fetch(finalPhotoUri);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        finalPhotoUri = `data:${contentType};base64,${base64}`;
      } catch (error: any) {
        throw new Error(`Не удалось загрузить фото по ссылке: ${error.message}`);
      }
    }

    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: finalPhotoUri } },
          {
            text: `Professional barber image editing task. Change the hairstyle to: ${input.hairstyleDescription}. Keep the face features and background the same. Result should be only the modified image.`
          },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
      });

      const media = response.media;

      if (!media || !media.url) {
        throw new Error('ИИ не вернул изображение. Попробуйте другое фото или более короткое описание стиля.');
      }

      return { generatedHairstyleImage: media.url };
    } catch (error: any) {
      console.error('AI Error:', error);
      
      const errMsg = error.message || '';
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Лимит запросов исчерпан. Пожалуйста, подождите 60 секунд.');
      }

      if (errMsg.includes('400') || errMsg.includes('invalid_argument')) {
        throw new Error('Ошибка параметров: попробуйте использовать фото меньшего размера (например, скриншот) или выберите другой стиль из предложенных.');
      }
      
      throw new Error(`Ошибка при генерации: ${errMsg}`);
    }
  }
);
