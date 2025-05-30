export interface ProblemInfo {
    url: string;
    title: string;
    description: string;
    code: string;
    language: string;
    testCasesPassed: string;
    difficulty: string;
    tags: string[];
}

export interface Message {
    action: string;
    problemInfo?: ProblemInfo;
}

declare global {
    interface Window {
        __algoChatInjected: boolean;
        monaco?: {
            editor: {
                getModels: () => { getValue: () => string }[];
            };
        };
    }
} 