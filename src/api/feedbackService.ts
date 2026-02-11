import { api } from './client';
import { AxiosResponse } from 'axios';

// Mock function to simulate sending feedback
export const sendFeedback = async (
    email: string | null,
    content: string
): Promise<AxiosResponse<any>> => {
    console.log(`[Mock API] Sending feedback... Email: ${email}, Content: ${content}`);

    // Simulate network delay (1 second)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return a mock success response
    // In a real scenario, this would be: return await api.post('/feedback', { email, content });
    return {
        data: {
            success: true,
            message: 'Feedback sent successfully (Mock)',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
    };
};
