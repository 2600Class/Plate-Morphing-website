export interface CarPlateState {
  originalImage: string | null;
  generatedImage: string | null;
  plateNumber: string;
  plateCountry: string;
  mode: 'add' | 'replace';
  isGenerating: boolean;
  error: string | null;
  statusMessage?: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}