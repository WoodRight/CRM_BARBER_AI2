
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
    let finalPhotoUri = input.photoDataUri.trim();

    // Серверная загрузка для обхода CORS и оптимизации заголовков
    if (finalPhotoUri.startsWith('http')) {
      try {
        const response = await fetch(finalPhotoUri, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        finalPhotoUri = `data:${contentType};base64,${base64}`;
      } catch (error: any) {
        throw new Error(`Не удалось загрузить фото: ${error.message}`);
      }
    }

    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: finalPhotoUri } },
          {
            text: `Professional hairstyle edit. Change the hair style to: ${input.hairstyleDescription}. Keep facial features and background identical. Output only the modified image.`
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
        throw new Error('ИИ не вернул изображение. Пожалуйста, попробуйте еще раз или выберите другой стиль.');
      }

      return { generatedHairstyleImage: media.url };
    } catch (error: any) {
      const errMsg = error.message || '';
      console.error('Gemini AI Error:', errMsg);
      
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Лимит запросов исчерпан. Пожалуйста, подождите 60 секунд.');
      }

      if (errMsg.includes('400') || errMsg.includes('invalid_argument')) {
        throw new Error('Ошибка параметров: попробуйте использовать скриншот фото (он весит меньше) или выберите другой стиль из списка.');
      }
      
      throw new Error(`Ошибка ИИ: ${errMsg}`);
    }
  }
);
