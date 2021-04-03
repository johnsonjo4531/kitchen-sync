export const MessageChannel = 'require' in globalThis && typeof globalThis?.require === 'function' ? globalThis?.require('worker_threads').MessageChannel : MessageChannel;
