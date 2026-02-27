'use server';
/**
 * @fileOverview This flow allows clients to upload their photo and generate images
 *   of themselves with various suggested hairstyles using AI, so they can visually
 *   preview how different cuts would look on them.
 *
 * - aiHairstyleTryOn - A function that handles the AI hairstyle visualization process.
 * - AiHairstyleTryOnInput - The input type for the aiHairstyleTryOn function.
 * - AiHairstyleTryOnOutput - The return type for the aiHairstyleTryOn function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiHairstyleTryOnInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the client, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  hairstyleDescription: z
    .string()
    .describe(
      'A description of the desired hairstyle to apply, e.g., "short buzz cut", "long curly hair", "classic pompadour", "sleek bob".'
    ),
});
export type AiHairstyleTryOnInput = z.infer<typeof AiHairstyleTryOnInputSchema>;

const AiHairstyleTryOnOutputSchema = z.object({
  generatedHairstyleImage: z
    .string()
    .describe('The data URI of the generated image showing the client with the new hairstyle.')
    .refine((val) => val.startsWith('data:image/'), 'Must be a data URI for an image. Expected format: data:image/<mime_type>;base64,<encoded_data>'),
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
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image',
      prompt: [
        { media: { url: input.photoDataUri } },
        {
          text:
            `Apply the following hairstyle to the person in the provided photo: ${input.hairstyleDescription}. ` +
            `The new hairstyle should look natural, considering the person's head shape, facial features, and skin tone. ` +
            `Maintain consistent lighting and image quality with the original photo.`,
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Required for Gemini 2.5 Flash Image
      },
    });

    if (!media || !media.url) {
      throw new Error('Failed to generate hairstyle image.');
    }

    return { generatedHairstyleImage: media.url };
  }
);
