// src/ai/flows/donor-faq-chatbot.ts
'use server';

/**
 * @fileOverview An AI chatbot for answering donor FAQs.
 *
 * - donorFaqChatbot - A function that handles the chatbot interaction.
 * - DonorFaqChatbotInput - The input type for the donorFaqChatbot function.
 * - DonorFaqChatbotOutput - The return type for the donorFaqChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DonorFaqChatbotInputSchema = z.object({
  query: z.string().describe('The user query about blood donation.'),
});
export type DonorFaqChatbotInput = z.infer<typeof DonorFaqChatbotInputSchema>;

const DonorFaqChatbotOutputSchema = z.object({
  answer: z.string().describe('The answer to the user query.'),
});
export type DonorFaqChatbotOutput = z.infer<typeof DonorFaqChatbotOutputSchema>;

export async function donorFaqChatbot(input: DonorFaqChatbotInput): Promise<DonorFaqChatbotOutput> {
  return donorFaqChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'donorFaqChatbotPrompt',
  input: {schema: DonorFaqChatbotInputSchema},
  output: {schema: DonorFaqChatbotOutputSchema},
  prompt: `You are a chatbot designed to answer questions about blood donation.

  Answer the following question:

  {{query}}`,
});

const donorFaqChatbotFlow = ai.defineFlow(
  {
    name: 'donorFaqChatbotFlow',
    inputSchema: DonorFaqChatbotInputSchema,
    outputSchema: DonorFaqChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
